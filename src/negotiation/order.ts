import { BigNumber } from "bignumber.js";
import { Token } from "../tokens/tokens";

export interface Order {
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

export function isOrderValid(order: Order): boolean {
  if (
    !(
      order.ask.ledger &&
      order.ask.asset &&
      order.ask.nominalAmount &&
      order.bid.ledger &&
      order.bid.asset &&
      order.bid.nominalAmount &&
      order.validUntil &&
      order.id
    )
  ) {
    return false;
  }

  const askAmount = new BigNumber(order.ask.nominalAmount, 10);
  const bidAmount = new BigNumber(order.bid.nominalAmount, 10);

  return !askAmount.isNaN() && !bidAmount.isNaN();
}

export function toTradingPair(order: Order): string {
  return (
    order.ask.ledger +
    "-" +
    order.ask.asset +
    "-" +
    order.bid.ledger +
    "-" +
    order.bid.asset
  );
}

export function isNative({ asset, ledger }: OrderAsset): boolean {
  return (
    (asset === "bitcoin" && ledger === "bitcoin") ||
    (asset === "ether" && ledger === "ethereum")
  );
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
