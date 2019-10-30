import { BitcoinWallet } from "./bitcoinWallet";
import { Cnd, SwapRequest } from "./cnd";
import { EthereumWallet } from "./ethereumWallet";
import { Swap } from "./swap";
export declare class ComitClient {
    private readonly bitcoinWallet;
    private readonly ethereumWallet;
    private readonly cnd;
    constructor(bitcoinWallet: BitcoinWallet, ethereumWallet: EthereumWallet, cnd: Cnd);
    sendSwap(swapRequest: SwapRequest): Promise<Swap>;
    getNewSwaps(): Promise<Swap[]>;
    getOngoingSwaps(): Promise<Swap[]>;
    getDoneSwaps(): Promise<Swap[]>;
    getPeerId(): Promise<string>;
    getPeerListenAddresses(): Promise<string[]>;
    private newSwap;
}
