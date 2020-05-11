import { AxiosPromise, AxiosResponse } from "axios";
import { FieldValueResolverFn } from "./action_to_http_request";
import { SwapSubEntity } from "./rfc003_payload";
import { Action } from "./siren";
import { HalightLightningBitcoinHanEthereumEtherRequestBody, HalightLightningBitcoinHerc20EthereumErc20RequestBody, HanEthereumEtherHalightLightningBitcoinRequestBody, Herc20EthereumErc20HalightLightningBitcoinRequestBody, SwapRequest } from "./swaps_payload";
export interface Ledger {
    name: string;
    chain_id?: number;
    network?: string;
}
export declare function ledgerIsEthereum(ledger: Ledger): boolean;
export interface Asset {
    name: string;
    quantity: string;
    token_contract?: string;
}
export interface Peer {
    peer_id: string;
    address_hint?: string;
}
/**
 * Facilitates access to the [COMIT network daemon (cnd)](@link https://github.com/comit-network/comit-rs) REST API.
 */
export declare class Cnd {
    private readonly client;
    constructor(cndUrl: string);
    /**
     * Get the peer id of the cnd node
     *
     * @returns Promise that resolves with the peer id of the cnd node,
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    getPeerId(): Promise<string>;
    /**
     * Get the address on which cnd is listening for peer-to-peer/COMIT messages.
     *
     * @returns An array of multiaddresses
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    getPeerListenAddresses(): Promise<string[]>;
    /**
     * Sends a swap request to cnd.
     *
     * @param swap The details of the swap to initiate.
     * @returns The URL of the swap request on the cnd REST API.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    postSwap(swap: SwapRequest): Promise<string>;
    /**
     * List the swaps handled by this cnd instance.
     *
     * @returns An Array of {@link SwapSubEntity}, which contains details of the swaps.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    getSwaps(): Promise<SwapSubEntity[]>;
    /**
     * Fetch data from the REST API.
     *
     * @param path The URL to GET.
     * @returns The data returned by cnd.
     * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
     */
    fetch<T>(path: string): AxiosPromise<T>;
    /**
     * Proceed with an action request on the cnd REST API.
     *
     * @param action The action to perform.
     * @param resolver A function that returns data needed to perform the action, this data is likely to be provided by a
     * blockchain wallet or interface (e.g. wallet address).
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    executeSirenAction(action: Action, resolver?: FieldValueResolverFn): Promise<AxiosResponse>;
    /**
     * Post a swap request on the lightning REST API route of cnd `/swaps/han/ethereum/ether/halight/lightning/bitcoin`
     * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
     * @return The location of the swap (href) as returned by the REST API in the location header.
     */
    createHanEthereumEtherHalightLightningBitcoin(body: HanEthereumEtherHalightLightningBitcoinRequestBody): Promise<string>;
    /**
     * Post a swap request on the lightning REST API route of cnd `/swaps/herc20/ethereum/erc20/halight/lightning/bitcoin`
     * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
     * @return The location of the swap (href) as returned by the REST API in the location header.
     */
    createHerc20EthereumErc20HalightLightningBitcoin(body: Herc20EthereumErc20HalightLightningBitcoinRequestBody): Promise<string>;
    /**
     * Post a swap request on the lightning REST API route of cnd `/swaps/halight/lightning/bitcoin/han/ethereum/ether`
     * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
     * @return The location of the swap (href) as returned by the REST API in the location header.
     */
    createHalightLightningBitcoinHanEthereumEther(body: HalightLightningBitcoinHanEthereumEtherRequestBody): Promise<string>;
    /**
     * Post a swap request on the lightning REST API route of cnd `/swaps/halight/lightning/bitcoin/herc20/ethereum/erc20`
     * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
     * @return The location of the swap (href) as returned by the REST API in the location header.
     */
    createHalightLightningBitcoinHerc20EthereumErc20(body: HalightLightningBitcoinHerc20EthereumErc20RequestBody): Promise<string>;
    private getInfo;
}
