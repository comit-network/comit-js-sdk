import express from "express";
import { ComitClient } from "../comitClient";
import { sleep, timeoutPromise, TryParams } from "../timeout_promise";
import { ExecutionParams } from "./execution_params";
import { Order, orderSwapMatchesForMaker } from "./order";

export class MakerNegotiator {
  private ordersByTradingPair: { [tradingPair: string]: Order } = {};
  private ordersById: { [orderId: string]: Order } = {};
  private readonly executionParams: ExecutionParams;
  private readonly comitClient: ComitClient;
  private readonly tryParams: TryParams;

  constructor(
    comitClient: ComitClient,
    executionParams: ExecutionParams,
    tryParams: TryParams
  ) {
    this.executionParams = executionParams;
    this.comitClient = comitClient;
    this.tryParams = tryParams;
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

  private tryAcceptSwap(
    swapId: string,
    order: Order,
    { maxTimeoutSecs, tryIntervalSecs }: TryParams
  ) {
    return timeoutPromise(
      maxTimeoutSecs * 1000,
      this.acceptSwap(swapId, order, tryIntervalSecs)
    );
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
        console.log(
          "Swap request was malformed, giving up on trying to accept"
        );
        // The swap request is not as expected, no need to try again
        break;
      }
    }
  }
}

export class MakerHttpApi {
  private readonly maker: MakerNegotiator;

  constructor(maker: MakerNegotiator) {
    this.maker = maker;
  }

  public listen(port: number) {
    const app = express();

    app.use(express.json());

    app.get("/", (_, res) =>
      res.send("MakerNegotiator's Negotiation Service is up and running!")
    );

    app.get("/orders/:tradingPair", async (req, res) => {
      const order = this.maker.getOrderByTradingPair(req.params.tradingPair);
      if (!order) {
        res.status(404).send("Trading pair not found");
      } else {
        res.send(order);
      }
    });

    app.get("/orders/:tradingPair/:orderId/executionParams", async (_, res) => {
      res.send(this.maker.getExecutionParams());
    });

    app.post("/orders/:tradingPair/:orderId/take", async (req, res) => {
      const order = this.maker.getOrderById(req.params.orderId);
      const body = req.body;

      if (!order || req.params.tradingPair !== order.tradingPair) {
        res.status(404).send("Order not found");
      } else if (!body || !body.swapId) {
        res.status(400).send("swapId missing from payload");
      } else {
        res.send(this.maker.takeOrder(body.swapId, order));
      }
    });

    app.listen(port, () =>
      console.log(`Maker's Negotiation Service is listening on port ${port}.`)
    );
  }

  public addOrder(order: Order) {
    this.maker.addOrder(order);
  }
}
