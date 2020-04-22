import axios, { AxiosInstance, AxiosPromise, AxiosResponse } from "axios";
import actionToHttpRequest, {
  FieldValueResolverFn
} from "./action_to_http_request";
import { problemResponseInterceptor } from "./axios_rfc7807_middleware";
import { SwapSubEntity } from "./rfc003_payload";
import { Action, Entity } from "./siren";
import {
  HalightLightningBitcoinHanEthereumEtherRequestBody,
  HalightLightningBitcoinHerc20EthereumErc20RequestBody,
  HanEthereumEtherHalightLightningBitcoinRequestBody,
  Herc20EthereumErc20HalightLightningBitcoinRequestBody,
  SwapRequest
} from "./swaps_payload";

interface GetInfo {
  id: string;
  listen_addresses: string[]; // multiaddresses
}

export interface Ledger {
  name: string;
  chain_id?: number;
  network?: string;
}

export function ledgerIsEthereum(ledger: Ledger): boolean {
  return ledger.name === "ethereum";
}

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
export class Cnd {
  private readonly client: AxiosInstance;

  public constructor(cndUrl: string) {
    this.client = axios.create({
      baseURL: cndUrl
    });
    this.client.interceptors.response.use(
      response => response,
      problemResponseInterceptor
    );
  }

  /**
   * Get the peer id of the cnd node
   *
   * @returns Promise that resolves with the peer id of the cnd node,
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async getPeerId(): Promise<string> {
    const info = await this.getInfo();
    if (!info.id) {
      throw new Error("id field not present");
    }

    return info.id;
  }

  /**
   * Get the address on which cnd is listening for peer-to-peer/COMIT messages.
   *
   * @returns An array of multiaddresses
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async getPeerListenAddresses(): Promise<string[]> {
    const info = await this.getInfo();
    if (!info.listen_addresses) {
      throw new Error("listen addresses field not present");
    }

    return info.listen_addresses;
  }

  /**
   * Sends a swap request to cnd.
   *
   * @param swap The details of the swap to initiate.
   * @returns The URL of the swap request on the cnd REST API.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async postSwap(swap: SwapRequest): Promise<string> {
    const response = await this.client.post("swaps/rfc003", swap);

    return response.headers.location;
  }

  /**
   * List the swaps handled by this cnd instance.
   *
   * @returns An Array of {@link SwapSubEntity}, which contains details of the swaps.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public async getSwaps(): Promise<SwapSubEntity[]> {
    const response = await this.fetch("swaps");
    const entity = response.data as Entity;

    return entity.entities as SwapSubEntity[];
  }

  /**
   * Fetch data from the REST API.
   *
   * @param path The URL to GET.
   * @returns The data returned by cnd.
   * @throws A {@link Problem} from the cnd REST API or an {@link Error}.
   */
  public fetch<T>(path: string): AxiosPromise<T> {
    return this.client.get(path);
  }

  /**
   * Proceed with an action request on the cnd REST API.
   *
   * @param action The action to perform.
   * @param resolver A function that returns data needed to perform the action, this data is likely to be provided by a
   * blockchain wallet or interface (e.g. wallet address).
   * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
   */
  public async executeSirenAction(
    action: Action,
    resolver?: FieldValueResolverFn
  ): Promise<AxiosResponse> {
    const request = await actionToHttpRequest(action, resolver);

    return this.client.request(request);
  }

  /**
   * Post a swap request on the lightning REST API route of cnd `/swaps/han/ethereum/ether/halight/lightning/bitcoin`
   * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
   * @return The location of the swap (href) as returned by the REST API in the location header.
   */
  public async createHanEthereumEtherHalightLightningBitcoin(
    body: HanEthereumEtherHalightLightningBitcoinRequestBody
  ): Promise<string> {
    const response = await this.client.post(
      "swaps/han/ethereum/ether/halight/lightning/bitcoin",
      body
    );

    return response.headers.location;
  }

  /**
   * Post a swap request on the lightning REST API route of cnd `/swaps/herc20/ethereum/erc20/halight/lightning/bitcoin`
   * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
   * @return The location of the swap (href) as returned by the REST API in the location header.
   */
  public async createHerc20EthereumErc20HalightLightningBitcoin(
    body: Herc20EthereumErc20HalightLightningBitcoinRequestBody
  ): Promise<string> {
    const response = await this.client.post(
      "swaps/herc20/ethereum/erc20/halight/lightning/bitcoin",
      body
    );

    return response.headers.location;
  }

  /**
   * Post a swap request on the lightning REST API route of cnd `/swaps/halight/lightning/bitcoin/han/ethereum/ether`
   * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
   * @return The location of the swap (href) as returned by the REST API in the location header.
   */
  public async createHalightLightningBitcoinHanEthereumEther(
    body: HalightLightningBitcoinHanEthereumEtherRequestBody
  ): Promise<string> {
    const response = await this.client.post(
      "swaps/halight/lightning/bitcoin/han/ethereum/ether",
      body
    );

    return response.headers.location;
  }

  /**
   * Post a swap request on the lightning REST API route of cnd `/swaps/halight/lightning/bitcoin/herc20/ethereum/erc20`
   * @param body The body to set in the request. The design being not yet finalised it is optional and of type `any`
   * @return The location of the swap (href) as returned by the REST API in the location header.
   */
  public async createHalightLightningBitcoinHerc20EthereumErc20(
    body: HalightLightningBitcoinHerc20EthereumErc20RequestBody
  ): Promise<string> {
    const response = await this.client.post(
      "swaps/halight/lightning/bitcoin/herc20/ethereum/erc20",
      body
    );

    return response.headers.location;
  }

  private async getInfo(): Promise<GetInfo> {
    const response = await this.client.get("/");

    return response.data;
  }
}
