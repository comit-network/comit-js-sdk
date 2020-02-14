import { OrderParams } from "../order";

export class MakerClient {
  // @ts-ignore
  constructor(makerUrl: string) {
    // @ts-ignore
  }

  public async getOrderByTradingPair(
    tradingPair: string
  ): Promise<OrderParams> {
    const words = tradingPair.split("-");

    return {
      id: "123",
      validUntil: 1234567890,
      ask: {
        ledger: words[0],
        asset: words[1],
        nominalAmount: "123"
      },
      bid: {
        ledger: words[2],
        asset: words[3],
        nominalAmount: "4567890"
      }
    };
  }

  // @ts-ignore
  public async getExecutionParams(order: OrderParams) {
    throw new Error("getExecutionParams");
  }

  // @ts-ignore
  public async takeOrder(order: OrderParams, swapId: string) {
    throw new Error("takeOrder");
  }
}
