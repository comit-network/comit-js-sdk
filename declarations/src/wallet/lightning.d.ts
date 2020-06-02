import { AddressType, GetInfoResponse, Invoice, SendResponse } from "@radar/lnrpc";
import { Lnd } from "../lnd";
export declare class LightningWallet {
    readonly lnd: Lnd;
    readonly p2pSocket: string;
    static newInstance(certPath: string | false, macaroonPath: string, lndRpcSocket: string, lndP2pSocket: string): Promise<LightningWallet>;
    private constructor();
    sendPayment(publicKey: string, satAmount: string, secretHash: string, finalCltvDelta: number): Promise<() => Promise<SendResponse>>;
    addHoldInvoice(satAmount: string, secretHash: string, expiry: number, cltvExpiry: number): Promise<string>;
    settleInvoice(secret: string): Promise<void>;
    newAddress(type: AddressType): Promise<string>;
    confirmedChannelBalance(): Promise<string>;
    confirmedWalletBalance(): Promise<string>;
    getPubkey(): Promise<string>;
    getInfo(): Promise<GetInfoResponse>;
    openChannel(toPubkey: string, satAmount: number): Promise<Outpoint>;
    sendPaymentWithRequest(paymentRequest: string): Promise<SendResponse>;
    lookupInvoice(secretHash: string): Promise<Invoice>;
    addInvoice(satAmount: string): Promise<{
        rHash: string;
        paymentRequest: string;
    }>;
    /**
     * Asserts that the available lnd instance is the same than the one connected to cnd.
     *
     * @param selfPublicKey
     * @param chain
     * @param network
     * @throws Error if the lnd instance details mismatch
     */
    assertLndDetails(selfPublicKey: string, chain: string, network: string): Promise<void>;
}
export interface Outpoint {
    txId: string;
    vout: number;
}
