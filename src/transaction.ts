import { EthereumWallet } from "./wallet/ethereum";

export enum TransactionStatus {
  /**
   * The transaction was rejected by the blockchain node.
   */
  Failed,
  /**
   * The transaction was accepted by the blockchain node but yet to be mined.
   */
  Pending,
  /**
   * The transaction was mined.
   */
  Confirmed
}

/**
 * A handy interface to know the status of a blockchain transaction
 */
export class Transaction {
  constructor(
    private wallet: { ethereum?: EthereumWallet },
    public id: string
  ) {}

  /**
   * @returns The transaction status by asking the blockchain.
   */
  public async status(): Promise<TransactionStatus> {
    if (!!this.wallet.ethereum) {
      return this.ethereumStatus();
    }
    throw new Error("Wallet was not set");
  }

  private async ethereumStatus(): Promise<TransactionStatus> {
    const wallet = this.ethereumWallet;
    const receipt = await wallet.getTransactionReceipt(this.id);
    if (!receipt) {
      throw new Error(`Could not retrieve receipt for ${this.id} on Ethereum`);
    }
    if (receipt.status === undefined || receipt.status === 0) {
      return TransactionStatus.Failed;
    }
    const transaction = await wallet.getTransaction(this.id);
    if (!transaction) {
      throw new Error(
        `Could not retrieve transaction for ${this.id} on Ethereum`
      );
    }
    if (transaction.confirmations === 0) {
      return TransactionStatus.Pending;
    }
    return TransactionStatus.Confirmed;
  }

  private get ethereumWallet(): EthereumWallet {
    if (this.wallet.ethereum) {
      return this.wallet.ethereum;
    }
    throw new Error("This is not an Ethereum Swap Transaction.");
  }
}
