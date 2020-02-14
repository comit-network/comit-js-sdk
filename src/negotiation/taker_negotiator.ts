import { SwapRequest } from "../cnd";
import { ComitClient } from "../comit_client";
import { Swap } from "../swap";
import {
  defaultLedgerParams,
  ExecutionParams,
  isValidExecutionParams
} from "./execution_params";
import { MakerClient } from "./maker_client";
import { assetOrderToSwap, OrderParams, TakerCriteria } from "./order";

export class TakerNegotiator {
  private static newSwapRequest(
    order: OrderParams,
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
  private readonly makerClient: MakerClient;

  constructor(comitClient: ComitClient, makerUrl: string) {
    this.comitClient = comitClient;
    this.makerClient = new MakerClient(makerUrl);
  }

  public async getOrderByTradingPair(
    tradingPair: string
  ): Promise<OrderParams> {
    return this.makerClient.getOrderByTradingPair(tradingPair);
  }

  public async getOrder(criteria: TakerCriteria): Promise<OrderParams> {
    const tradingPair = criteria.sell + "-" + criteria.buy;
    return this.makerClient.getOrderByTradingPair(tradingPair);
  }

  public async takeOrder(order: OrderParams): Promise<Swap | undefined> {
    const executionParams = await this.makerClient.getExecutionParams(order);
    if (!executionParams) {
      return;
    }

    if (!isValidExecutionParams(executionParams)) {
      return;
    }

    const swapRequest = TakerNegotiator.newSwapRequest(order, executionParams);
    if (!swapRequest) {
      return;
    }

    const swapHandle = await this.comitClient.sendSwap(swapRequest);

    const swapDetails = await swapHandle.fetchDetails();
    const swapId = swapDetails.properties!.id;
    await this.makerClient.takeOrder(order, swapId);
    return swapHandle;
  }
}
