import { Asset, Ledger, SwapProperties } from "../cnd";
import { getToken } from "../tokens/tokens";

export interface Order {
  tradingPair: string;
  id: string;
  validUntil: number;
  bid: OrderAsset;
  ask: OrderAsset;
}

export interface OrderAsset {
  ledger: string;
  asset: string;
  amount: string;
}

export function orderSwapMatchesForMaker(
  order: Order,
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
      swapAsset.quantity === orderAsset.amount &&
      swapLedger.name === orderAsset.ledger
    );
  }

  if (swapLedger.name === "ethereum") {
    const token = getToken(orderAsset.asset);
    if (token) {
      // TODO: It may make more sense to use eponymous unit in order instead of smallest unit (e.g. Use Ether instead of Wei
      return (
        swapAsset.name.toLowerCase() === token.type.toLowerCase() &&
        swapAsset.quantity === orderAsset.amount
      );
    }
  }

  return false;
}

export function assetOrderToSwap(orderAsset: OrderAsset): Asset | undefined {
  if (isNative(orderAsset)) {
    return {
      name: orderAsset.asset,
      quantity: orderAsset.amount
    };
  }

  const token = getToken(orderAsset.asset);
  if (token) {
    return {
      name: token.type.toLowerCase(),
      quantity: orderAsset.amount,
      token_contract: token.address
    };
  }

  return undefined;
}
