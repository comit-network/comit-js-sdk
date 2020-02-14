import axios from "axios";
import { Order } from "./order";

export class MakerClient {
  private readonly makerUrl: string;

  constructor(makerUrl: string) {
    this.makerUrl = makerUrl;
  }

  public async getOrderByTradingPair(tradingPair: string): Promise<Order> {
    const response = await axios.get(`${this.makerUrl}orders/${tradingPair}`);
    return response.data;
  }

  public async getExecutionParams(order: Order) {
    const response = await axios.get(
      `${this.makerUrl}orders/${order.tradingPair}/${order.id}/executionParams`
    );
    return response.data;
  }

  public async takeOrder(order: Order, swapId: string) {
    const response = await axios.post(
      `${this.makerUrl}orders/${order.tradingPair}/${order.id}/take`,
      { swapId }
    );
    return response.data;
  }
}
