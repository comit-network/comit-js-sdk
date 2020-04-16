/**
 * These are the payload for the `/swaps/` REST API that supports halight swaps (lightning) and that will replace
 * the `/swaps/rfc003` endpoint once all other swaps pair are supported.
 */

import { Asset, Ledger, Peer } from "./cnd";

/**
 * The parameters that the two parties have agreed on for swap execution.
 *
 * The swap request is sent by the party in the role of Alice to initiate a swap with Bob.
 */
export interface SwapRequest {
  alpha_ledger: Ledger;
  alpha_asset: Asset;
  beta_ledger: Ledger;
  beta_asset: Asset;
  alpha_expiry?: number;
  beta_expiry?: number;
  alpha_ledger_refund_identity?: string;
  beta_ledger_redeem_identity?: string;
  peer: Peer;
}

interface CoreRequestBody<A, B> {
  alpha: A;
  beta: B;
  role: "Alice" | "Bob";
  peer: Peer;
}

export interface RequestParams {
  amount: string;
  identity: string;
}

interface Han {
  absolute_expiry: number;
}

interface Herc20 {
  contract_address: string;
  absolute_expiry: number;
}

interface Halight {
  cltv_expiry: number;
}

interface Bitcoin {
  network: string;
}

interface Ethereum {
  chain_id: number;
}

export type HanEthereumEtherRequestParams = RequestParams & Han & Ethereum;
export type HalightLightningBitcoinRequestParams = RequestParams &
  Halight &
  Bitcoin;
export type Herc20EthereumErc20RequestParams = RequestParams &
  Herc20 &
  Ethereum;

export type HanEthereumEtherHalightLightningBitcoinRequestBody = CoreRequestBody<
  HanEthereumEtherRequestParams,
  HalightLightningBitcoinRequestParams
>;
export type Herc20EthereumErc20HalightLightningBitcoinRequestBody = CoreRequestBody<
  Herc20EthereumErc20RequestParams,
  HalightLightningBitcoinRequestParams
>;
export type HalightLightningBitcoinHanEthereumEtherRequestBody = CoreRequestBody<
  HalightLightningBitcoinRequestParams,
  HanEthereumEtherRequestParams
>;
export type HalightLightningBitcoinHerc20EthereumErc20RequestBody = CoreRequestBody<
  HalightLightningBitcoinRequestParams,
  Herc20EthereumErc20RequestParams
>;
