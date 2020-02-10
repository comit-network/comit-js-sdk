import express from "express";
import * as http from "http";
import { ComitClient } from "../comitClient";
import { Result } from "../result";
import { sleep, timeoutPromise, TryParams } from "../timeout_promise";
import { ExecutionParams } from "./execution_params";
import { Order, orderSwapMatchesForMaker } from "./order";

export class MakerNegotiator {
  private ordersByTradingPair: { [tradingPair: string]: Order } = {};
  private ordersById: { [orderId: string]: Order } = {};
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

  public addOrder(order: Order) {
    this.ordersByTradingPair[order.tradingPair] = order;
    this.ordersById[order.id] = order;
  }

  // Below are methods related to the negotiation protocol
  public getOrderByTradingPair(tradingPair: string): Order | undefined {
    return this.ordersByTradingPair[tradingPair];
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.ordersById[orderId];
  }

  public getExecutionParams(): ExecutionParams {
    return this.executionParams;
  }

  public takeOrder(swapId: string, order: Order) {
    // Fire the auto-accept of the order in the background
    (async () => {
      try {
        await this.tryAcceptSwap(swapId, order, this.tryParams);
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

  private async tryAcceptSwap(
    swapId: string,
    order: Order,
    { maxTimeoutSecs, tryIntervalSecs }: TryParams
  ) {
    const res = await timeoutPromise(
      maxTimeoutSecs * 1000,
      this.acceptSwap(swapId, order, tryIntervalSecs)
    );
    return res.mapErr((err: Error) => {
      return new Error(`Could not accept swap: ${err}`);
    });
  }

  private async acceptSwap(
    swapId: string,
    order: Order,
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
        orderSwapMatchesForMaker(order, swapDetails.properties)
      ) {
        return swap.accept(this.tryParams);
      } else {
        return Result.err(
          new Error(
            "Swap response was malformed, giving up on trying to accept"
          )
        );
      }
    }
  }
}

class MakerHttpApi {
  private readonly getOrderById: (orderId: string) => Order | undefined;
  private readonly getExecutionParams: () => ExecutionParams;
  private readonly takeOrder: (swapId: string, order: Order) => void;
  private readonly getOrderByTradingPair: (
    tradingPair: string
  ) => Order | undefined;
  private server: http.Server | undefined;

  constructor(
    getOrderById: (orderId: string) => Order | undefined,
    getExecutionParams: () => ExecutionParams,
    takeOrder: (swapId: string, order: Order) => void,
    getOrderByTradingPair: (tradingPair: string) => Order | undefined
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

    app.get("/orders/:tradingPair/:orderId/executionParams", async (_, res) => {
      res.send(this.getExecutionParams());
    });

    app.post("/orders/:tradingPair/:orderId/take", async (req, res) => {
      const order = this.getOrderById(req.params.orderId);
      const body = req.body;

      if (!order || req.params.tradingPair !== order.tradingPair) {
        res.status(404).send("Order not found");
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
