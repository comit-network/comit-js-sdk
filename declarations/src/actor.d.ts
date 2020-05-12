import { ComitClient } from "./comit_client";
import { BitcoinWallet } from "./wallet/bitcoin";
import { EthereumWallet } from "./wallet/ethereum";
/**
 * Representation of an actor during swap execution.
 */
export interface Actor {
    name?: string;
    comitClient: ComitClient;
    peerId: string;
    addressHint: string;
    bitcoinWallet: BitcoinWallet;
    ethereumWallet: EthereumWallet;
}
export declare function createActor(bitcoinWallet: BitcoinWallet, ethereumWallet: EthereumWallet, cndUrl: string, name?: string): Promise<Actor>;
