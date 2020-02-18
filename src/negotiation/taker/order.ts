import { BigNumber } from "bignumber.js";
import { Asset } from "../../cnd";
import { Swap } from "../../swap";
import { getToken } from "../../tokens/tokens";
import {
  areOrderParamsValid,
  fromNominal,
  isNative,
  OrderAsset,
  OrderParams
} from "../order";

export interface TakerCriteria {
  buy: TakerCriteriaAsset;
  sell: TakerCriteriaAsset;
  minRate?: number;
}

export interface TakerCriteriaAsset {
  ledger: string;
  asset: string;
  minNominalAmount?: string;
  maxNominalAmount?: string;
}

/**
 * Handles an order for the taker. It has helper functions to facilitate the handler of an
 * order by a taker. This should only be instantiated via `TakerNegotiatior.getOrder()` and should not be constructed from
 * scratch.
 * @param orderParams - The raw parameters of the order.
 * @param criteria - The criteria used to get this order.
 * @param takeOrder - Function passed from the `TakerNegotiator` to coordinate calls to `cnd` and the maker to effectively
 * take the order and start the atomic swap execution.
 */
export class Order {
  /**
   * **Note: This should not be used, `Order` should be created by using `TakerNegotiatior.getOrder()`
   * @param orderParams - The parameters of the order, as received from the maker.
   * @param criteria - The criteria used to filter/retrieve this order.
   * @param takeOrder - `TakerNegotiator.execAndTakeOrder()`
   */
  constructor(
    public readonly orderParams: OrderParams,
    public readonly criteria: TakerCriteria,
    public readonly takeOrder: (
      orderParams: OrderParams
    ) => Promise<Swap | undefined>
  ) {}

  /**
   * @description: Return whether an order matches the passed criteria.
   */
  public matches(): boolean {
    return (
      assetMatches(this.criteria.buy, this.orderParams.bid) &&
      assetMatches(this.criteria.sell, this.orderParams.ask) &&
      rateMatches(this.criteria, this.orderParams)
    );
  }

  /**
   * Check that the order is valid and safe. Ensure that all properties are set and that the expiries
   * are safe. It does not check whether the ledgers/assets are correct, this is done with `Order.matches()`.
   */
  public isValid(): boolean {
    return areOrderParamsValid(this.orderParams);
  }

  /**
   * Initiates the swap execution and tells the maker that we are taking this order.
   * Does nothing if the order is invalid or does not match the passed criteria.
   */
  public async take(): Promise<Swap | undefined> {
    if (this.isValid() && this.matches()) {
      return this.takeOrder(this.orderParams);
    }
  }

  /**
   * Returned the rate of the order offered by the maker.
   */
  public getOfferedRate(): BigNumber {
    return orderRate(this.orderParams);
  }
}

/**
 * This is only exported for test purposes
 * @param criteria
 * @param orderParams
 */
export function rateMatches(
  criteria: TakerCriteria,
  orderParams: OrderParams
): boolean {
  if (criteria.minRate) {
    const rate = orderRate(orderParams);
    return rate.isGreaterThanOrEqualTo(criteria.minRate);
  }

  return true;
}

function orderRate(orderParams: OrderParams) {
  const buy = new BigNumber(orderParams.bid.nominalAmount);
  const sell = new BigNumber(orderParams.ask.nominalAmount);

  return buy.div(sell);
}

function assetMatches(
  criteriaAsset: TakerCriteriaAsset,
  orderAsset: OrderAsset
): boolean {
  if (criteriaAsset.minNominalAmount) {
    const minAmount = new BigNumber(criteriaAsset.minNominalAmount);
    if (!minAmount.isLessThanOrEqualTo(orderAsset.nominalAmount)) {
      return false;
    }
  }

  if (criteriaAsset.maxNominalAmount) {
    const maxAmount = new BigNumber(criteriaAsset.maxNominalAmount);
    if (!maxAmount.isGreaterThanOrEqualTo(orderAsset.nominalAmount)) {
      return false;
    }
  }

  return (
    criteriaAsset.asset === orderAsset.asset &&
    criteriaAsset.ledger === orderAsset.ledger
  );
}

export function assetOrderToSwap(orderAsset: OrderAsset): Asset | undefined {
  if (isNative(orderAsset)) {
    const name = orderAsset.asset;
    const quantity = fromNominal(name, orderAsset.nominalAmount);
    if (!quantity) {
      return undefined;
    }
    return {
      name,
      quantity: quantity.toString()
    };
  }

  const token = getToken(orderAsset.asset);
  if (token) {
    const name = token.type.toLowerCase();
    const quantity = fromNominal(name, orderAsset.nominalAmount, token);
    if (!quantity) {
      return undefined;
    }

    return {
      name,
      quantity: quantity.toString(),
      token_contract: token.address
    };
  }

  return undefined;
}

export function takerCriteriaToTradingPair(
  takerCriteria: TakerCriteria
): string {
  return (
    takerCriteria.sell.ledger +
    "-" +
    takerCriteria.sell.asset +
    "-" +
    takerCriteria.buy.ledger +
    "-" +
    takerCriteria.buy.asset
  );
}
