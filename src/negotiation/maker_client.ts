import axios from "axios";
import { OrderParams } from "./order";

export class MakerClient {
  private readonly makerUrl: string;

  constructor(makerUrl: string) {
    this.makerUrl = makerUrl;
  }

  public async getOrderByTradingPair(
    tradingPair: string
  ): Promise<OrderParams> {
    const response = await axios.get(`${this.makerUrl}orders/${tradingPair}`);
    return response.data;
  }

  public async getExecutionParams(order: OrderParams) {
    const response = await axios.get(
      `${this.makerUrl}orders/${order.id}/executionParams`
    );
    return response.data;
  }

  public async takeOrder(order: OrderParams, swapId: string) {
    const response = await axios.post(
      `${this.makerUrl}orders/${order.id}/take`,
      { swapId }
    );
    return response.data;
  }
}
