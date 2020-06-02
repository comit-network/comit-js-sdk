/**
 * @ignore
 * @packageDocumentation
 */
import { BitcoinWallet } from "../bitcoin";
export declare class MockBitcoinWallet implements BitcoinWallet {
    broadcastTransaction(transactionHex: string, network: string): Promise<string>;
    getAddress(): Promise<string>;
    getBalance(): Promise<number>;
    getFee(): string;
    sendToAddress(address: string, satoshis: number, network: string): Promise<string>;
}
