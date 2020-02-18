import { BigNumber } from "bignumber.js";
import { Asset, Ledger, SwapProperties } from "../../cnd";
import { getToken, Token } from "../../tokens/tokens";
import { fromNominal, isNative, OrderAsset, OrderParams } from "../order";

/**
 * Check that a given swap matches the agreed conditions of an accepted order.
 * @param orderParams - The parameters of the agreed order.
 * @param props - The properties of the the swap to check.
 */
export function orderSwapMatchesForMaker(
  orderParams: OrderParams,
  props: SwapProperties
): boolean {
  const params = props.parameters;

  return (
    orderSwapAssetMatchesForMaker(
      orderParams.ask,
      params.alpha_asset,
      params.alpha_ledger
    ) &&
    orderSwapAssetMatchesForMaker(
      orderParams.bid,
      params.beta_asset,
      params.beta_ledger
    )
  );
}

function orderSwapAssetMatchesForMaker(
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
