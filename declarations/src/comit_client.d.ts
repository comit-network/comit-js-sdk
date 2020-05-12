import { Cnd } from "./cnd/cnd";
import { SwapSubEntity } from "./cnd/rfc003_payload";
import { SwapRequest } from "./cnd/swaps_payload";
import { Swap } from "./swap";
import { BitcoinWallet } from "./wallet/bitcoin";
import { EthereumWallet } from "./wallet/ethereum";
/**
 * The ComitClient class is a one-stop shop interface for interacting with {@link Swap}s of {@link Cnd}.
 *
 * It bundles all the necessary dependencies ({@link BitcoinWallet}, {@link EthereumWallet}, {@link Cnd}) to
 * provide you with instances of {@link Swap}s.
 */
export declare class ComitClient {
    private readonly cnd;
    private bitcoinWallet?;
    private ethereumWallet?;
    constructor(cnd: Cnd);
    /**
     * Sets a {@link BitcoinWallet} in the ComitClient.
     *
     * If you are planning to use this instance to handle swaps involving Bitcoin, you should set this.
     *
     * @param bitcoinWallet The wallet that should be used to handle Bitcoin related actions of swaps.
     */
    withBitcoinWallet(bitcoinWallet: BitcoinWallet): ComitClient;
    /**
     * Sets a {@link EthereumWallet} in the ComitClient.
     *
     * If you are planning to use this instance to handle swaps involving Ethereum, you should set this.
     *
     * @param ethereumWallet The wallet that should be used to handle Ethereum related actions of swaps.
     */
    withEthereumWallet(ethereumWallet: EthereumWallet): ComitClient;
    /**
     * Send a {@link SwapRequest} to {@link Cnd} to create a {@link Swap}.
     * @param swapRequest
     */
    sendSwap(swapRequest: SwapRequest): Promise<Swap>;
    getNewSwaps(): Promise<Swap[]>;
    getAllSwaps(): Promise<Swap[]>;
    getOngoingSwaps(): Promise<Swap[]>;
    getDoneSwaps(): Promise<Swap[]>;
    getPeerId(): Promise<string>;
    getPeerListenAddresses(): Promise<string[]>;
    retrieveSwapById(swapId: string): Promise<Swap | undefined>;
    private newSwap;
}
export declare function isOngoing(swap: SwapSubEntity): boolean;
