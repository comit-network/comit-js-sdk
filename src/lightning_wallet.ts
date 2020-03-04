import {
  AddressType,
  Chain,
  GetInfoResponse,
  Invoice,
  OpenStatusUpdate,
  SendResponse
} from "@radar/lnrpc";
import pEvent from "p-event";
import { Lnd } from "./lnd";

export class LightningWallet {
  public static async newInstance(
    certPath: string | false,
    macaroonPath: string,
    lndRpcSocket: string,
    lndP2pSocket: string
  ): Promise<LightningWallet> {
    const lnd = await Lnd.init({
      tls: certPath,
      macaroonPath,
      server: lndRpcSocket
    });
    return new LightningWallet(lnd, lndP2pSocket);
  }

  private constructor(
    public readonly lnd: Lnd,
    public readonly p2pSocket: string
  ) {}

  public async sendPayment(
    publicKey: string,
    satAmount: string,
    secretHash: string,
    finalCltvDelta: number
  ): Promise<SendResponse> {
    const publicKeyBuf = Buffer.from(publicKey, "hex");
    const paymentHash = Buffer.from(secretHash, "hex");

    return this.lnd.lnrpc.sendPaymentSync({
      dest: publicKeyBuf,
      amt: satAmount,
      paymentHash,
      finalCltvDelta
    });
  }

  public async addHoldInvoice(
    satAmount: string,
    secretHash: string,
    expiry: number,
    cltvExpiry: number
  ): Promise<string> {
    const satAmountNum = parseInt(satAmount, 10);
    const hash = Buffer.from(secretHash, "hex");
    return (
      await this.lnd.invoicesrpc.addHoldInvoice({
        value: satAmountNum,
        hash,
        cltvExpiry,
        expiry
      })
    ).paymentRequest;
  }

  public async settleInvoice(secret: string): Promise<void> {
    const preimage = Buffer.from(secret, "hex");
    await this.lnd.invoicesrpc.settleInvoice({ preimage });
  }

  public async newAddress(type: AddressType): Promise<string> {
    return (await this.lnd.lnrpc.newAddress({ type })).address;
  }

  public async confirmedChannelBalance(): Promise<string> {
    return (await this.lnd.lnrpc.channelBalance()).balance;
  }

  public async confirmedWalletBalance(): Promise<string> {
    return (await this.lnd.lnrpc.walletBalance()).confirmedBalance;
  }

  public async getPubkey(): Promise<string> {
    return (await this.lnd.lnrpc.getInfo()).identityPubkey;
  }

  public async getInfo(): Promise<GetInfoResponse> {
    return this.lnd.lnrpc.getInfo();
  }

  public async openChannel(
    toPubkey: string,
    satAmount: number
  ): Promise<Outpoint> {
    const request = {
      nodePubkey: Buffer.from(toPubkey, "hex"),
      localFundingAmount: satAmount.toString()
    };
    const openChannel = this.lnd.lnrpc.openChannel(request);

    openChannel.on("error", (err: any) => {
      throw new Error(
        `Error encountered for Open Channel: ${JSON.stringify(err)}`
      );
    });

    const status: OpenStatusUpdate = await pEvent(openChannel, "data");

    return outpointFromChannelStatusUpdate(status);
  }

  public async sendPaymentWithRequest(
    paymentRequest: string
  ): Promise<SendResponse> {
    return this.lnd.lnrpc.sendPaymentSync({ paymentRequest });
  }

  public async lookupInvoice(secretHash: string): Promise<Invoice> {
    return this.lnd.lnrpc.lookupInvoice({
      rHashStr: secretHash
    });
  }

  public async addInvoice(
    satAmount: string
  ): Promise<{ rHash: string; paymentRequest: string }> {
    const { rHash, paymentRequest } = await this.lnd.lnrpc.addInvoice({
      value: satAmount
    });

    if (typeof rHash === "string") {
      return { rHash, paymentRequest };
    } else {
      return { rHash: rHash.toString("hex"), paymentRequest };
    }
  }

  public async assertLndDetails(
    selfPublicKey: string,
    chain: string,
    network: string
  ): Promise<void> {
    const getinfo = await this.lnd.lnrpc.getInfo();

    if (getinfo.identityPubkey !== selfPublicKey) {
      throw new Error(
        `lnd self public key does not match cnd expectations. Expected:${selfPublicKey}, actual:${getinfo.identityPubkey}`
      );
    }

    if (getinfo.chains.length !== 1) {
      throw new Error(
        `lnd is connected to several chains, this is unexpected. Chains: ${JSON.stringify(
          getinfo.chains
        )}`
      );
    }

    // Type hacking until https://github.com/RadarTech/lnrpc/pull/73 is merged and released
    const chainUnknown = getinfo.chains[0] as unknown;
    const lndChain = chainUnknown as Chain;

    if (lndChain.chain !== chain || lndChain.network !== network) {
      throw new Error(
        `lnd chain does not match cnd expectation. Expected:${lndChain}, actual:{ chain: "${chain}", network: "${network}" }`
      );
    }
  }
}

export interface Outpoint {
  txId: string;
  vout: number;
}

function outpointFromChannelStatusUpdate(status: OpenStatusUpdate): Outpoint {
  let txId;
  let vout;

  if (status.chanOpen) {
    const {
      fundingTxidStr,
      fundingTxidBytes,
      outputIndex
    } = status.chanOpen.channelPoint;
    if (fundingTxidStr) {
      txId = fundingTxidStr;
    } else if (fundingTxidBytes) {
      txId = fundingTxidBytes;
    }
    vout = outputIndex;
  }

  if (status.chanPending) {
    txId = status.chanPending.txid;
    vout = status.chanPending.outputIndex;
  }

  if (vout) {
    if (typeof txId === "string") {
      return { txId, vout };
    } else if (txId) {
      /// We reverse the endianness of the buffer to match the encoding of transaction ids returned in ListChannels
      const txIdStr = txId.reverse().toString("hex");
      return { txId: txIdStr, vout };
    }
  }

  throw new Error(`OpenStatusUpdate is malformed: ${JSON.stringify(status)}`);
}
