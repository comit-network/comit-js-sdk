import { Order, OrderAsset } from "../order";

function tickerToAsset(ticker: string): OrderAsset {
  switch (ticker) {
    case "ETH":
      return { ledger: "ethereum", asset: "ether", nominalAmount: "99" };
    case "BTC":
      return { ledger: "bitcoin", asset: "bitcoin", nominalAmount: "11" };
    default:
      throw new Error("Unknown ticker");
  }
}

export class MakerClient {
  // @ts-ignore
  constructor(makerUrl: string) {
    // @ts-ignore
  }

  public async getOrderByTradingPair(tradingPair: string): Promise<Order> {
    const bidTicker = tradingPair.substr(0, 3);
    const askTicker = tradingPair.substr(4, 3);

    return {
      tradingPair,
      id: "123",
      validUntil: 1234567890,
      bid: tickerToAsset(bidTicker),
      ask: tickerToAsset(askTicker)
    };
  }

  // @ts-ignore
  public async getExecutionParams(order: Order) {
    throw new Error("getExecutionParams");
  }

  // @ts-ignore
  public async takeOrder(order: Order, swapId: string) {
    throw new Error("takeOrder");
  }
}
