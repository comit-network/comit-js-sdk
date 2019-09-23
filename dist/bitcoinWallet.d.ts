export declare class BitcoinWallet {
    readonly network: any;
    private readonly walletdb;
    private wallet;
    private address;
    private readonly pool;
    private readonly chain;
    private readonly logger;
    constructor(network: string);
    init(peerUri: string, hdKey: string): Promise<void>;
    getBalance(): Promise<any>;
    getAddress(): any;
    sendToAddress(address: string, satoshis: number, network: string): Promise<{
        tx: any;
        broadcast: any;
    }>;
    broadcastTransaction(transactionHex: string, network: string): Promise<any>;
    private isInit;
    private assertNetwork;
}
