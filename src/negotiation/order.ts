import { BigNumber } from "bignumber.js";
import { Asset, Ledger, SwapProperties } from "../cnd";
import { Swap } from "../swap";
import { getToken, Token } from "../tokens/tokens";

export interface OrderParams {
  id: string;
  validUntil: number;
  bid: OrderAsset;
  ask: OrderAsset;
}

export interface OrderAsset {
  ledger: string;
  asset: string;
  nominalAmount: string;
}

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
 * @description An order handler for the taker. It has helper functions to facilitate the handler of an
 * order by a taker. This should only be created via `TakerNegotiatior.getOrder()` and should not be constructed from
 * scratch.
 * @param orderParams - The raw parameters of the order.
 * @param criteria - The criteria used to get this order.
 * @param takeOrder - Function passed from the `TakerNegotiator` to coordinate calls to `cnd` and the maker to effectively
 * take the order and start the atomic swap execution.
 */
export class Order {
  /**
   * @description **Note: This should not be used, `Order` should be created by using `TakerNegotiatior.getOrder()`
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
   * @description Check that the order is valid and safe. Ensure that all properties are set and that the expiries
   * are relatively safe. It does not check whether the ledgers/assets are correct, this is done with `Order.matches()`.
   */
  public isValid(): boolean {
    return areOrderParamsValid(this.orderParams);
  }

  /**
   * @description Initiate the swap execution and tells the maker that we are taking this order.
   * Does nothing if the order is invalid or does not match the passed criteria.
   */
  public async take(): Promise<Swap | undefined> {
    if (this.isValid() && this.matches()) {
      return this.takeOrder(this.orderParams);
    }
  }
}

/**
 * @description This is only exported for test purposes
 * @param criteria
 * @param orderParams
 */
export function rateMatches(
  criteria: TakerCriteria,
  orderParams: OrderParams
): boolean {
  if (criteria.minRate) {
    const buy = new BigNumber(orderParams.bid.nominalAmount);
    const sell = new BigNumber(orderParams.ask.nominalAmount);

    const orderRate = buy.div(sell);

    return orderRate.isGreaterThanOrEqualTo(criteria.minRate);
  }

  return true;
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

export function orderSwapMatchesForMaker(
  order: OrderParams,
  props: SwapProperties
): boolean {
  const params = props.parameters;

  return (
    orderSwapAssetMatchesForMaker(
      order.ask,
      params.alpha_asset,
      params.alpha_ledger
    ) &&
    orderSwapAssetMatchesForMaker(
      order.bid,
      params.beta_asset,
      params.beta_ledger
    )
  );
}

export function isNative({ asset, ledger }: OrderAsset): boolean {
  return (
    (asset === "bitcoin" && ledger === "bitcoin") ||
    (asset === "ether" && ledger === "ethereum")
  );
}

export function orderSwapAssetMatchesForMaker(
  orderAsset: OrderAsset,
  swapAsset: Asset,
  swapLedger: Ledger
): boolean {
  if (isNative(orderAsset)) {
    return (
      swapAsset.name === orderAsset.asset &&
      areAmountsEqual(
        swapAsset.name,
        swapAsset.quantity,
        orderAsset.nominalAmount
      ) &&
      swapLedger.name === orderAsset.ledger
    );
  }

  if (swapLedger.name === "ethereum") {
    const token = getToken(orderAsset.asset);
    if (token) {
      return (
        swapAsset.name.toLowerCase() === token.type.toLowerCase() &&
        areAmountsEqual(
          swapAsset.name,
          swapAsset.quantity,
          orderAsset.nominalAmount,
          token
        )
      );
    }
  }

  return false;
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

function areAmountsEqual(
  asset: string,
  unitAmount: string,
  nominalAmount: string,
  token?: Token
): boolean {
  const amount = fromNominal(asset, nominalAmount, token);

  if (!amount) {
    return false;
  }

  return amount.eq(new BigNumber(unitAmount));
}

const BITCOIN_DECIMALS = 8;
const ETHER_DECIMALS = 18;

export function fromNominal(
  asset: string,
  nominalAmount: string,
  token?: Token
): BigNumber | undefined {
  let decimals = 0;
  switch (asset) {
    case "bitcoin": {
      decimals = BITCOIN_DECIMALS;
      break;
    }
    case "ether": {
      decimals = ETHER_DECIMALS;
      break;
    }
    default: {
      if (token) {
        decimals = token.decimals;
      } else {
        return undefined;
      }
    }
  }
  return new BigNumber(10).pow(decimals).times(nominalAmount);
}

export function orderParamsToTradingPair(orderParams: OrderParams): string {
  return (
    orderParams.ask.ledger +
    "-" +
    orderParams.ask.asset +
    "-" +
    orderParams.bid.ledger +
    "-" +
    orderParams.bid.asset
  );
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

export function areOrderParamsValid(orderParams: OrderParams): boolean {
  if (
    !(
      orderParams.ask.ledger &&
      orderParams.ask.asset &&
      orderParams.ask.nominalAmount &&
      orderParams.bid.ledger &&
      orderParams.bid.asset &&
      orderParams.bid.nominalAmount &&
      orderParams.validUntil &&
      orderParams.id
    )
  ) {
    return false;
  }

  const askAmount = new BigNumber(orderParams.ask.nominalAmount, 10);
  const bidAmount = new BigNumber(orderParams.bid.nominalAmount, 10);

  return !askAmount.isNaN() && !bidAmount.isNaN();
}
