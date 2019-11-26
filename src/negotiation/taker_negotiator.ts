import axios from "axios";
import { SwapRequest } from "../cnd";
import { ComitClient } from "../comitClient";
import { Swap } from "../swap";
import {
  defaultLedgerParams,
  ExecutionParams,
  isValidExecutionParams
} from "./execution_params";
import { assetOrderToSwap, Order } from "./order";

export class TakerNegotiator {
  private static newSwapRequest(
    order: Order,
    executionParams: ExecutionParams
  ): undefined | SwapRequest {
    if (!executionParams.ledgers) {
      executionParams.ledgers = defaultLedgerParams();
    }

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

  private readonly comitClient: ComitClient;

  constructor(comitClient: ComitClient) {
    this.comitClient = comitClient;
  }

  public async negotiateAndInitiateSwap(
    makerNegotiator: MakerClient,
    tradingPair: string,
    isOrderAcceptable: (order: Order) => boolean
  ): Promise<{ order: Order; swap?: Swap }> {
    const order = await this.negotiate(makerNegotiator, tradingPair);

    if (order && isOrderAcceptable(order)) {
      const swap = await this.initiateSwap(makerNegotiator, order);
      return { swap, order };
    }
    return { order };
  }

  public async initiateSwap(
    makerNegotiator: MakerClient,
    order: Order
  ): Promise<Swap | undefined> {
    const executionParams = await makerNegotiator.getExecutionParams(order);
    if (executionParams && isValidExecutionParams(executionParams)) {
      const swapRequest = TakerNegotiator.newSwapRequest(
        order,
        executionParams
      );
      if (swapRequest) {
        const swapHandle = await this.comitClient.sendSwap(swapRequest);

        const swapDetails = await swapHandle.fetchDetails();
        const swapId = swapDetails.properties!.id;
        await makerNegotiator.acceptOrder(order, swapId);
        return swapHandle;
      }
    }
  }

  public async negotiate(
    makerNegotiator: MakerClient,
    tradingPair: string
  ): Promise<Order> {
    return makerNegotiator.getOrderByTradingPair(tradingPair);
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

  public async getExecutionParams(order: Order) {
    const response = await axios.get(
      `${this.makerUrl}orders/${order.tradingPair}/${order.id}/executionParams`
    );
    return response.data;
  }

  public async acceptOrder(order: Order, swapId: string) {
    const response = await axios.post(
      `${this.makerUrl}orders/${order.tradingPair}/${order.id}/accept`,
      { swapId }
    );
    return response.data;
  }
}
