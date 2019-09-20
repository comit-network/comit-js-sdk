import axios, { AxiosResponse } from "axios";
import URI from "urijs";
import { Action, EmbeddedRepresentationSubEntity, Entity } from "../gen/siren";
import actionToHttpRequest, {
  FieldValueResolverFn
} from "./actionToHttpRequest";

interface GetInfo {
  id: string;
  listen_addresses: string[]; // multiaddresses
}

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

export type LedgerAction =
  | {
      type: "bitcoin-send-amount-to-address";
      payload: BitcoinSendAmountToAddressPayload;
    }
  | {
      type: "bitcoin-broadcast-signed-transaction";
      payload: BitcoinBroadcastSignedTransactionPayload;
    }
  | {
      type: "ethereum-deploy-contract";
      payload: EthereumDeployContractPayload;
    }
  | {
      type: "ethereum-call-contract";
      payload: EthereumCallContractPayload;
    };

/**
 * Facilitates access to the cnd REST API
 */
export class Cnd {
  private readonly cndUrl: string;

  public constructor(cndUrl: string) {
    this.cndUrl = cndUrl;
  }

  public async getPeerId(): Promise<string> {
    const info = await this.getInfo();
    if (!info.id) {
      throw new Error("id field not present");
    }
    return info.id;
  }

  public postSwap(swap: SwapRequest): Promise<string> {
    return axios.post(
      this.rootUrl()
        .path("swaps/rfc003")
        .toString(),
      swap
    );
  }

  public async getSwaps(): Promise<EmbeddedRepresentationSubEntity[]> {
    const response = await axios.get(
      this.rootUrl()
        .path("swaps")
        .toString()
    );
    const entity = response.data as Entity;
    return entity.entities as EmbeddedRepresentationSubEntity[];
  }

  public async executeAction(
    action: Action,
    resolver?: FieldValueResolverFn
  ): Promise<AxiosResponse> {
    const request = await actionToHttpRequest(action, resolver);

    return axios.request({
      baseURL: this.cndUrl,
      ...request
    });
  }

  public async getSwap(id: string): Promise<EmbeddedRepresentationSubEntity> {
    const response = await axios.get(
      this.rootUrl()
        .path("swaps/rfc003/")
        .segment(id)
        .toString()
    );
    return response.data as EmbeddedRepresentationSubEntity;
  }

  private rootUrl() {
    return new URI(this.cndUrl);
  }

  private async getInfo(): Promise<GetInfo> {
    const response = await axios.get(this.rootUrl().toString());
    return response.data;
  }
}
