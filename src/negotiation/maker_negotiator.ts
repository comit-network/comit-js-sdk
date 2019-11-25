import express from "express";
import { ComitClient } from "../comitClient";
import { sleep, timeoutPromise, TryParams } from "../timeout_promise";
import { ExecutionParams } from "./execution_params";
import { Order } from "./order";

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

  public getOrderByTradingPair(tradingPair: string): Order | undefined {
    return this.ordersByTradingPair[tradingPair];
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.ordersById[orderId];
  }

  public acceptOrder(
    // @ts-ignore
    order: Order
  ): ExecutionParams | undefined {
    // Fire the auto-accept of the order in the background
    (async () => {
      try {
        await this.tryAcceptSwap(order, this.tryParams);
      } catch (error) {
        console.log("Could not accept the swap");
      }
    })();
    return this.executionParams;
  }

  public addOrder(order: Order) {
    this.ordersByTradingPair[order.tradingPair] = order;
    this.ordersById[order.id] = order;
  }

  private async tryAcceptSwap(
    order: Order,
    { timeout, tryInterval }: TryParams
  ) {
    return timeoutPromise(timeout, this.acceptSwap(order, tryInterval));
  }

  private async acceptSwap(order: Order, tryInterval: number) {
    while (true) {
      await sleep(tryInterval);

      const swap = await this.comitClient.retrieveSwapByOrder(order);

      if (!swap) {
        continue;
      }

      return swap.accept(this.tryParams);
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

    app.post("/orders/:tradingPair/:orderId/accept", async (req, res) => {
      const order = this.maker.getOrderById(req.params.orderId);
      if (!order || req.params.tradingPair !== order.tradingPair) {
        res.status(404).send("Order not found");
      } else {
        res.send(this.maker.acceptOrder(order));
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
