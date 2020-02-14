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
}

export interface TakerCriteriaAsset {
  ledger: string;
  asset: string;
  minNominalAmount?: string;
  maxNominalAmount?: string;
}

export class Order {
  constructor(
    public readonly orderParams: OrderParams,
    public readonly criteria: TakerCriteria,
    public readonly takeOrder: (
      orderParams: OrderParams
    ) => Promise<Swap | undefined>
  ) {}

  public matches(): boolean {
    return (
      assetMatches(this.criteria.buy, this.orderParams.bid) &&
      assetMatches(this.criteria.sell, this.orderParams.ask)
    );
  }

  public isValid(): boolean {
    if (
      !(
        this.orderParams.ask.ledger &&
        this.orderParams.ask.asset &&
        this.orderParams.ask.nominalAmount &&
        this.orderParams.bid.ledger &&
        this.orderParams.bid.asset &&
        this.orderParams.bid.nominalAmount &&
        this.orderParams.validUntil &&
        this.orderParams.id
      )
    ) {
      return false;
    }

    const askAmount = new BigNumber(this.orderParams.ask.nominalAmount, 10);
    const bidAmount = new BigNumber(this.orderParams.bid.nominalAmount, 10);

    return !askAmount.isNaN() && !bidAmount.isNaN();
  }

  /**
   * @description Tells the maker that we are taking this order.
   */
  public async take(): Promise<Swap | undefined> {
    if (this.isValid() && this.matches()) {
      return this.takeOrder(this.orderParams);
    }
  }
}

function assetMatches(
  criteriaAsset: TakerCriteriaAsset,
  orderAsset: OrderAsset
) {
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
