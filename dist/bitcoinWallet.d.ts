export declare class BitcoinWallet {
    readonly network: any;
    private readonly walletdb;
    private readonly pool;
    private readonly chain;
    private readonly wallet;
    private readonly address;
    static newInstance(network: string, peerUri: string, hdKey: string): Promise<BitcoinWallet>;
    private constructor();
    getBalance(): Promise<any>;
    getAddress(): any;
    sendToAddress(address: string, satoshis: number, network: string): Promise<{
        tx: any;
        broadcast: any;
    }>;
    broadcastTransaction(transactionHex: string, network: string): Promise<any>;
    private assertNetwork;
}
