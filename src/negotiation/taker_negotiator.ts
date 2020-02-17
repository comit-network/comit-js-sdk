import { SwapRequest } from "../cnd";
import { ComitClient } from "../comit_client";
import { Swap } from "../swap";
import {
  defaultLedgerParams,
  ExecutionParams,
  isValidExecutionParams
} from "./execution_params";
import { MakerClient } from "./maker_client";
import {
  assetOrderToSwap,
  Order,
  OrderParams,
  TakerCriteria,
  takerCriteriaToTradingPair
} from "./order";

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

  /**
   * Get an order from the maker based on specified criteria. Whatever is returned from the maker is
   * returned here, even if it does not match the criteria or is invalid. Not all criteria are passed to the maker.
   * If it is indeed invalid or mismatching it will not be possible to execute the order, however it gives the
   * opportunity to the lib consumer to know that this maker returns invalid orders and the details of such order.
   * @param criteria - The criteria of the order that we are looking for.
   */
  public async getOrder(criteria: TakerCriteria): Promise<Order> {
    const tradingPair = takerCriteriaToTradingPair(criteria);
    const orderParams = await this.makerClient.getOrderByTradingPair(
      tradingPair
    );

    return new Order(orderParams, criteria, this.execAndTakeOrder.bind(this));
  }

  /**
   * **Note: This should not be used, `Order.take()` should be preferred.**
   * Executes the order by retrieving the execution parameters from the maker, initiating the swap with local cnd
   * and informing the maker that we are taking the order.
   * @param order - The order to take.
   */
  public async execAndTakeOrder(order: OrderParams): Promise<Swap | undefined> {
    const executionParams = await this.makerClient.getExecutionParams(order);
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
    await this.makerClient.takeOrder(order.id, swapId);
    return swapHandle;
  }
}
