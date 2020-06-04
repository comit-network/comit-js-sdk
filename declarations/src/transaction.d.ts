import { BitcoinWallet } from "./wallet/bitcoin";
import { EthereumWallet } from "./wallet/ethereum";
export declare enum TransactionStatus {
    /**
     * The transaction was rejected by the blockchain node.
     */
    Failed = 0,
    /**
     * The transaction was not yet mined and its status is uncertain.
     */
    Pending = 1,
    /**
     * The transaction was mined.
     */
    Confirmed = 2,
    /**
     * The transaction could not be retrieved.
     */
    NotFound = 3
}
/**
 * A handy interface to know the status of a blockchain transaction
 */
export declare class Transaction {
    private wallet;
    id: string;
    constructor(wallet: {
        ethereum?: EthereumWallet;
        bitcoin?: BitcoinWallet;
    }, id: string);
    /**
     * @param confirmations - Optional number of confirmations to wait for before returning.
     * @returns The transaction status by asking the blockchain.
     * @throws Ethereum: If the Receipt cannot be retrieved despite the transaction being mined.
     */
    status(confirmations?: number): Promise<TransactionStatus>;
    private ethereumStatus;
    private bitcoinStatus;
    private get bitcoinWallet();
    private get ethereumWallet();
}
