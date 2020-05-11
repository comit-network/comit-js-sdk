/**
 * Interface defining the Bitcoin wallet functionalities needed by the SDK to execute a swap involving Bitcoin.
 * It is expected from a COMIT App developer to write their own class that would implement this interface.
 * Depending on the use case and platform, such class could interact with a hardware wallet API, display QR codes,
 * take input via text fields, etc.
 */
export interface BitcoinWallet {
    getAddress(): Promise<string>;
    getBalance(): Promise<number>;
    sendToAddress(address: string, satoshis: number, network: Network): Promise<string>;
    broadcastTransaction(transactionHex: string, network: Network): Promise<string>;
    getFee(): string;
}
export interface BitcoindWalletArgs {
    url: string;
    username: string;
    password: string;
    walletDescriptor: string;
    walletName: string;
    rescan?: boolean;
}
/**
 * Instance of a bitcoind 0.19.1 wallet.
 *
 * This is to be used for demos, examples and dev environment only. No safeguards are applied, no data is written on
 * the disk. This is not to be used for mainnet, instead, implement your own {@link BitcoinWallet}
 */
export declare class BitcoindWallet implements BitcoinWallet {
    private rpcClient;
    static newInstance({ url, username, password, walletDescriptor, walletName, rescan }: BitcoindWalletArgs): Promise<BitcoindWallet>;
    private constructor();
    getBalance(): Promise<number>;
    getAddress(): Promise<string>;
    sendToAddress(address: string, satoshis: number, network: Network): Promise<string>;
    broadcastTransaction(transactionHex: string, network: Network): Promise<string>;
    getFee(): string;
    close(): Promise<void>;
    private assertNetwork;
}
export declare type Network = "main" | "test" | "regtest";
