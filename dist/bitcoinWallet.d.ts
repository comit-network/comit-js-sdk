export declare class BitcoinWallet {
    readonly network: any;
    private readonly walletdb;
    private readonly pool;
    private readonly chain;
    private readonly wallet;
    static newInstance(network: string, peerUri: string, hdKey: string): Promise<BitcoinWallet>;
    private constructor();
    getBalance(): Promise<any>;
    getAddress(): Promise<any>;
    sendToAddress(address: string, satoshis: number, network: string): Promise<string>;
    broadcastTransaction(transactionHex: string, network: string): Promise<string>;
    getFee(): string;
    private assertNetwork;
}
