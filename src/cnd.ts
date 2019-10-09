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
  [k: string]: any;
}

export interface Asset {
  name: string;
  [k: string]: any;
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

export interface Swap {
  /**
   * The id of the swap.
   */
  id: string;
  /**
   * The peer-id of the counterparty of this swap.
   */
  counterparty: string;
  /**
   * The role in which you are participating in this swap.
   */
  role: "Alice" | "Bob";
  /**
   * The cryptographic protocol that is employed in this swap.
   */
  protocol: string;
  /**
   * The status this swap is currently in.
   */
  status: "IN_PROGRESS" | "SWAPPED" | "NOT_SWAPPED" | "INTERNAL_FAILURE";
  /**
   * The parameters of this swap.
   */
  parameters: {
    alpha_asset: Asset;
    alpha_ledger: LedgerAction;
    beta_asset: Asset;
    beta_ledger: Ledger;
    [k: string]: any;
  };
  /**
   * The detailed state of the swap.
   */
  state?: {
    /**
     * The state of the alpha ledger regarding the swap.
     */
    alpha_ledger: {
      /**
       * The transaction ID of the deployment transaction on the alpha ledger.
       */
      deploy_tx: string | null;
      fund_tx: string | null;
      htlc_location: any;
      redeem_tx: string | null;
      refund_tx: string | null;
      /**
       * The status of the HTLC on the alpha ledger.
       */
      status:
        | "NOT_DEPLOYED"
        | "DEPLOYED"
        | "FUNDED"
        | "REDEEMED"
        | "REFUNDED"
        | "INCORRECTLY_FUNDED";
      [k: string]: any;
    };
    /**
     * The state of the beta ledger regarding the swap.
     */
    beta_ledger: {
      /**
       * The transaction ID of the deployment transaction on the beta ledger.
       */
      deploy_tx: string | null;
      fund_tx: string | null;
      htlc_location: any;
      redeem_tx: string | null;
      refund_tx: string | null;
      /**
       * The status of the HTLC on the beta ledger.
       */
      status:
        | "NOT_DEPLOYED"
        | "DEPLOYED"
        | "FUNDED"
        | "REDEEMED"
        | "REFUNDED"
        | "INCORRECTLY_FUNDED";
      [k: string]: any;
    };
    /**
     * The state created during the communication of the two parties regarding the swap.
     */
    communication: {
      /**
       * The expiry value of the HTLC on the alpha ledger. The semantic value depends on the ledger.
       */
      alpha_expiry: number;
      alpha_redeem_identity: string | null;
      alpha_refund_identity: string | null;
      beta_expiry: number;
      beta_redeem_identity: string | null;
      beta_refund_identity: string | null;
      secret_hash: string;
      status: "SENT" | "ACCEPTED" | "REJECTED";
      [k: string]: any;
    };
    [k: string]: any;
  };
  [k: string]: any;
}

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

  public async getPeerListenAddresses(): Promise<string[]> {
    const info = await this.getInfo();
    if (!info.listen_addresses) {
      throw new Error("listen addresses field not present");
    }
    return info.listen_addresses;
  }

  public async postSwap(swap: SwapRequest): Promise<string> {
    return axios
      .post(
        this.rootUrl()
          .path("swaps/rfc003")
          .toString(),
        swap
      )
      .then(res => res.data.id);
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

  private rootUrl() {
    return new URI(this.cndUrl);
  }

  private async getInfo(): Promise<GetInfo> {
    const response = await axios.get(this.rootUrl().toString());
    return response.data;
  }
}
