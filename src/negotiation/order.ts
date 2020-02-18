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

export function areOrderParamsValid(orderParams: Order): boolean {
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

export function orderParamsToTradingPair(orderParams: Order): string {
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
