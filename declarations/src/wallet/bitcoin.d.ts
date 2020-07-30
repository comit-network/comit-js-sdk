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
    getTransaction(transactionId: string): Promise<BitcoinTransaction>;
    /**
     * Only returns the transaction once the number of confirmations has been reached.
     *
     * @param transactionId
     * @param confirmations
     */
    getTransactionWithConfirmations(transactionId: string, confirmations: number): Promise<BitcoinTransaction>;
}
/**
 * A simplied representation of a Bitcoin transaction
 */
export interface BitcoinTransaction {
    hex: string;
    txid: string;
    confirmations: number;
}
export interface BitcoindWalletArgs {
    url: string;
    username: string;
    password: string;
    walletDescriptor: string;
    walletName: string;
    rescan?: boolean;
    refreshIntervalMs?: number;
}
/**
 * Instance of a bitcoind 0.19.1 wallet.
 *
 * This is to be used for demos, examples and dev environment only. No safeguards are applied, no data is written on
 * the disk. This is not to be used for mainnet, instead, implement your own {@link BitcoinWallet}
 */
export declare class BitcoindWallet implements BitcoinWallet {
    private rpcClient;
    private refreshIntervalMs?;
    static newInstance({ url, username, password, walletDescriptor, walletName, rescan, refreshIntervalMs }: BitcoindWalletArgs): Promise<BitcoindWallet>;
    private constructor();
    getBalance(): Promise<number>;
    getAddress(): Promise<string>;
    sendToAddress(address: string, satoshis: number, network: Network): Promise<string>;
    broadcastTransaction(transactionHex: string, network: Network): Promise<string>;
    getFee(): string;
    getTransaction(transactionId: string): Promise<BitcoinTransaction>;
    getTransactionWithConfirmations(transactionId: string, confirmations: number): Promise<BitcoinTransaction>;
    close(): Promise<void>;
    private assertNetwork;
    private get refreshInterval();
}
export declare type Network = "main" | "test" | "regtest";
