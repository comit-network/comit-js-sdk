import axios from "axios";
import { ExecutionParams } from "../execution_params";
import { Order } from "../order";

export class MakerClient {
  constructor(private readonly makerUrl: string) {}

  public async getOrderByTradingPair(tradingPair: string): Promise<Order> {
    const response = await axios.get(`${this.makerUrl}orders/${tradingPair}`);
    return response.data;
  }

  public async getExecutionParams(
    orderParams: Order
  ): Promise<ExecutionParams> {
    const response = await axios.get(
      `${this.makerUrl}orders/${orderParams.id}/executionParams`
    );
    return response.data;
  }

  /**
   * Tells the maker that we are taking this order and what is the swap id of the swap request sent for
   * this order from taker cnd to maker cnd.
   * @param orderId - The id of the order that is taken.
   * @param swapId - To facilitate matching between swap requests and orders, the taker first tells their
   * cnd to send a swap request to the maker's cnd, then use the unique swap id, known by both cnds, to tell the maker
   * that it is taking the order and what swap request is being use for this order. While this facilitates the
   * order<>swap matching logic on the maker's side, the maker still needs to double check the parameters of the swap.
   */
  public async takeOrder(orderId: string, swapId: string): Promise<void> {
    const response = await axios.post(
      `${this.makerUrl}orders/${orderId}/take`,
      { swapId }
    );
    return response.data;
  }
}
