import { SwapRequest } from "../../cnd";
import { ComitClient } from "../../comit_client";
import { Swap } from "../../swap";
import {
  defaultLedgerParams,
  ExecutionParams,
  isValidExecutionParams
} from "../execution_params";
import { Order as RawOrder } from "../order";
import { MakerClient } from "./maker_client";
import {
  assetOrderToSwap,
  MatchingCriteria,
  matchingCriteriaToTradingPair,
  Order
} from "./order";

export class Negotiator {
  private static newSwapRequest(
    rawOrder: RawOrder,
    executionParams: ExecutionParams
  ): undefined | SwapRequest {
    if (!executionParams.ledgers) {
      executionParams.ledgers = defaultLedgerParams();
    }

    const alphaAsset = assetOrderToSwap(rawOrder.ask);
    const alphaLedgerName = rawOrder.ask.ledger;

    const betaAsset = assetOrderToSwap(rawOrder.bid);
    const betaLedgerName = rawOrder.bid.ledger;

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

  /**
   * Get an order from the maker based on specified criteria. Whatever is returned from the maker is
   * returned here, even if it does not match the criteria or is invalid. Not all criteria are passed to the maker.
   * If it is indeed invalid or mismatching it will not be possible to execute the order, however it gives the
   * opportunity to the lib consumer to know that this maker returns invalid orders and the details of such order.
   * @param criteria - The criteria of the order to be requested from the maker.
   */
  public async getOrder(criteria: MatchingCriteria): Promise<Order> {
    const tradingPair = matchingCriteriaToTradingPair(criteria);
    const orderParams = await this.makerClient.getOrderByTradingPair(
      tradingPair
    );

    return new Order(orderParams, criteria, this.execAndTakeOrder.bind(this));
  }

  private async execAndTakeOrder(
    rawOrder: RawOrder
  ): Promise<Swap | undefined> {
    const executionParams = await this.makerClient.getExecutionParams(rawOrder);
    if (!isValidExecutionParams(executionParams)) {
      return;
    }

    const swapRequest = Negotiator.newSwapRequest(rawOrder, executionParams);
    if (!swapRequest) {
      return;
    }

    const swapHandle = await this.comitClient.sendSwap(swapRequest);

    const swapDetails = await swapHandle.fetchDetails();
    const swapId = swapDetails.properties!.id;
    await this.makerClient.takeOrder(rawOrder.id, swapId);
    return swapHandle;
  }
}
