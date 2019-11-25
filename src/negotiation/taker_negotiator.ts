import axios from "axios";
import { SwapRequest } from "../cnd";
import { ComitClient } from "../comitClient";
import { Swap } from "../swap";
import { ExecutionParams, validateExecutionParams } from "./execution_params";
import { assetOrderToSwap, Order } from "./order";

export class TakerNegotiator {
  private static newSwapRequest(
    order: Order,
    executionParams: ExecutionParams
  ): undefined | SwapRequest {
    const alphaAsset = assetOrderToSwap(order.ask);
    const alphaLedgerName = order.ask.ledger;

    const betaAsset = assetOrderToSwap(order.bid);
    const betaLedgerName = order.bid.ledger;

    if (alphaAsset && betaAsset) {
      return {
        alpha_ledger: {
          name: alphaLedgerName,
          network: executionParams.ledgers[alphaLedgerName].network,
          chain_id: executionParams.ledgers[alphaLedgerName].chain_id
        },
        alpha_asset: alphaAsset,
        beta_ledger: {
          name: betaLedgerName,
          network: executionParams.ledgers[betaLedgerName].network,
          chain_id: executionParams.ledgers[betaLedgerName].chain_id
        },
        beta_asset: betaAsset,
        alpha_expiry: executionParams.alpha_expiry,
        beta_expiry: executionParams.beta_expiry,
        peer: executionParams.peer
      };
    }
    return undefined;
  }
  public async negotiateAndSendRequest(
    comitClient: ComitClient,
    makerNegotiator: MakerClient,
    tradingPair: string,
    isOrderAcceptable: (order: Order) => boolean
  ): Promise<{ order: Order; swap?: Swap }> {
    const order = await makerNegotiator.getOrderByTradingPair(tradingPair);

    if (order && isOrderAcceptable(order)) {
      const executionParams = await makerNegotiator.acceptOrder(order);
      if (executionParams && validateExecutionParams(executionParams)) {
        const swapRequest = TakerNegotiator.newSwapRequest(
          order,
          executionParams
        );
        if (swapRequest) {
          const swap = await comitClient.sendSwap(swapRequest);
          return { order, swap };
        }
      }
    }
    return { order };
  }
}

export class MakerClient {
  private readonly makerUrl: string;

  constructor(makerUrl: string) {
    this.makerUrl = makerUrl;
  }

  public async getOrderByTradingPair(tradingPair: string) {
    const response = await axios.get(`${this.makerUrl}orders/${tradingPair}`);
    return response.data;
  }

  public async acceptOrder(order: Order) {
    const response = await axios.post(
      `${this.makerUrl}orders/${order.tradingPair}/${order.id}/accept`
    );
    return response.data;
  }
}
