import { AxiosResponse } from "axios";
import { Action, EmbeddedRepresentationSubEntity } from "../gen/siren";
import { FieldValueResolverFn } from "./actionToHttpRequest";
export interface Ledger {
    name: string;
    network: string;
}
export interface Asset {
    name: string;
    quantity: string;
}
export interface Peer {
    peer_id: string;
    address_hint: string;
}
export interface SwapRequest {
    alpha_ledger: Ledger;
    alpha_asset: Asset;
    beta_ledger: Ledger;
    beta_asset: Asset;
    alpha_expiry: number;
    beta_expiry: number;
    alpha_ledger_refund_identity?: string;
    beta_ledger_redeem_identity?: string;
    peer: Peer;
}
export interface BitcoinSendAmountToAddressPayload {
    to: string;
    amount: string;
    network: string;
}
export interface BitcoinBroadcastSignedTransactionPayload {
    hex: string;
    network: string;
}
export interface EthereumDeployContractPayload {
    data: string;
    amount: string;
    gas_limit: string;
    network: string;
}
export interface EthereumCallContractPayload {
    contract_address: string;
    data: string;
    gas_limit: string;
    network: string;
}
export declare type LedgerAction = {
    type: "bitcoin-send-amount-to-address";
    payload: BitcoinSendAmountToAddressPayload;
} | {
    type: "bitcoin-broadcast-signed-transaction";
    payload: BitcoinBroadcastSignedTransactionPayload;
} | {
    type: "ethereum-deploy-contract";
    payload: EthereumDeployContractPayload;
} | {
    type: "ethereum-call-contract";
    payload: EthereumCallContractPayload;
};
/**
 * Facilitates access to the cnd REST API
 */
export declare class Cnd {
    private readonly cndUrl;
    constructor(cndUrl: string);
    getPeerId(): Promise<string>;
    postSwap(swap: SwapRequest): Promise<string>;
    getSwaps(): Promise<EmbeddedRepresentationSubEntity[]>;
    executeAction(action: Action, resolver?: FieldValueResolverFn): Promise<AxiosResponse>;
    getSwap(id: string): Promise<EmbeddedRepresentationSubEntity>;
    private rootUrl;
    private getInfo;
}
