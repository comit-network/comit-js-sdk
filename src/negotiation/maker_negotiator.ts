import express from "express";
import * as http from "http";
import { ComitClient } from "../comit_client";
import { sleep, timeoutPromise, TryParams } from "../timeout_promise";
import { ExecutionParams } from "./execution_params";
import {
  areOrderParamsValid,
  OrderParams,
  orderParamsToTradingPair,
  orderSwapMatchesForMaker
} from "./order";

export class MakerNegotiator {
  private ordersByTradingPair: { [tradingPair: string]: OrderParams } = {};
  private ordersById: { [orderId: string]: OrderParams } = {};
  private readonly executionParams: ExecutionParams;
  private readonly comitClient: ComitClient;
  private readonly tryParams: TryParams;
  private readonly makerhttpApi: MakerHttpApi;

  constructor(
    comitClient: ComitClient,
    executionParams: ExecutionParams,
    tryParams: TryParams
  ) {
    this.executionParams = executionParams;
    this.comitClient = comitClient;
    this.tryParams = tryParams;
    this.makerhttpApi = new MakerHttpApi(
      this.getOrderById.bind(this),
      this.getExecutionParams.bind(this),
      this.takeOrder.bind(this),
      this.getOrderByTradingPair.bind(this)
    );
  }

  /**
   * add an Order to the order book.
   * @returns true if the order parameters are valid and were successfully added to the order book, false otherwise.
   * @param orderParams - the order to add.
   */
  public addOrder(orderParams: OrderParams): boolean {
    if (!areOrderParamsValid(orderParams)) {
      return false;
    }
    this.ordersByTradingPair[
      orderParamsToTradingPair(orderParams)
    ] = orderParams;
    this.ordersById[orderParams.id] = orderParams;
    return true;
  }

  // Below are methods related to the negotiation protocol
  public getOrderByTradingPair(tradingPair: string): OrderParams | undefined {
    return this.ordersByTradingPair[tradingPair];
  }

  public getOrderById(orderId: string): OrderParams | undefined {
    return this.ordersById[orderId];
  }

  public getExecutionParams(): ExecutionParams {
    return this.executionParams;
  }

  public takeOrder(swapId: string, orderParams: OrderParams) {
    // Fire the auto-accept of the order in the background
    (async () => {
      try {
        await this.tryAcceptSwap(swapId, orderParams, this.tryParams);
      } catch (error) {
        console.log("Could not accept the swap");
      }
    })();
  }
  // End of methods related to the negotiation protocol

  public getUrl(): string | undefined {
    return this.makerhttpApi.getUrl();
  }

  public listen(port: number, hostname?: string) {
    return this.makerhttpApi.listen(port, hostname);
  }

  private tryAcceptSwap(
    swapId: string,
    orderParams: OrderParams,
    { maxTimeoutSecs, tryIntervalSecs }: TryParams
  ) {
    return timeoutPromise(
      maxTimeoutSecs * 1000,
      this.acceptSwap(swapId, orderParams, tryIntervalSecs)
    );
  }

  private async acceptSwap(
    swapId: string,
    orderParams: OrderParams,
    tryIntervalSecs: number
  ) {
    while (true) {
      await sleep(tryIntervalSecs * 1000);

      const swap = await this.comitClient.retrieveSwapById(swapId);

      if (!swap) {
        continue;
      }

      const swapDetails = await swap.fetchDetails();

      if (
        swapDetails.properties &&
        orderSwapMatchesForMaker(orderParams, swapDetails.properties)
      ) {
        return swap.accept(this.tryParams);
      } else {
        console.log(
          "Swap request was malformed, giving up on trying to accept"
        );
        // The swap request is not as expected, no need to try again
        break;
      }
    }
  }
}

class MakerHttpApi {
  private readonly getOrderById: (orderId: string) => OrderParams | undefined;
  private readonly getExecutionParams: () => ExecutionParams;
  private readonly takeOrder: (
    swapId: string,
    orderParams: OrderParams
  ) => void;
  private readonly getOrderByTradingPair: (
    tradingPair: string
  ) => OrderParams | undefined;
  private server: http.Server | undefined;

  constructor(
    getOrderById: (orderId: string) => OrderParams | undefined,
    getExecutionParams: () => ExecutionParams,
    takeOrder: (swapId: string, orderParams: OrderParams) => void,
    getOrderByTradingPair: (tradingPair: string) => OrderParams | undefined
  ) {
    this.getOrderByTradingPair = getOrderByTradingPair;
    this.getOrderById = getOrderById;
    this.getExecutionParams = getExecutionParams;
    this.takeOrder = takeOrder;
    this.server = undefined;
  }

  public async listen(port: number, hostname?: string) {
    const app = express();

    app.use(express.json());

    app.get("/", (_, res) =>
      res.send("MakerNegotiator's Negotiation Service is up and running!")
    );

    app.get("/orders/:tradingPair", async (req, res) => {
      const order = this.getOrderByTradingPair(req.params.tradingPair);
      if (!order) {
        res.status(404).send("Trading pair not found");
      } else {
        res.send(order);
      }
    });

    app.get("/orders/:orderId/executionParams", async (_, res) => {
      res.send(this.getExecutionParams());
    });

    app.post("/orders/:orderId/take", async (req, res) => {
      const order = this.getOrderById(req.params.orderId);
      const body = req.body;

      if (!order) {
        res.status(404).send("OrderParams not found");
      } else if (!body || !body.swapId) {
        res.status(400).send("swapId missing from payload");
      } else {
        res.send(this.takeOrder(body.swapId, order));
      }
    });

    if (hostname) {
      this.server = app.listen(port, hostname, () =>
        console.log(
          `Maker's Negotiation Service is listening on ${hostname}:${port}.`
        )
      );
    } else {
      this.server = app.listen(port, () =>
        console.log(`Maker's Negotiation Service is listening on port ${port}.`)
      );
    }

    // Waiting for the server to start
    let i = 0;
    while (!this.server.listening && i < 10) {
      await sleep(100);
      i++;
    }
    if (!this.server.listening) {
      throw new Error(
        `There was an error starting the http server, is ${port} already in use?`
      );
    }
  }

  public getUrl(): undefined | string {
    if (this.server) {
      const addr = this.server.address();
      if (typeof addr === "string") {
        return addr;
      }
      if (typeof addr === "object") {
        if (addr!.family === "IPv6") {
          return `http://[${addr!.address}]:${addr!.port}`;
        } else {
          return `http://${addr!.address}:${addr!.port}`;
        }
      }
    }
  }
}
