import { ethers, Wallet } from "ethers";
import { TransactionRequest } from "ethers/providers";
import { BigNumber } from "ethers/utils";
import { fromExtendedKey } from "ethers/utils/hdnode";

export class EthereumWallet {
  private readonly wallet: Wallet;

  public constructor(hdKey: string) {
    const provider = new ethers.providers.JsonRpcProvider(
      "http://localhost:8545"
    );
    this.wallet = new ethers.Wallet(fromExtendedKey(hdKey)).connect(provider);
  }

  public getAccount() {
    return this.wallet.address;
  }

  public getBalance() {
    return this.wallet.getBalance();
  }

  public deployContract(data: string, value: BigNumber, gasLimit: string) {
    const transaction: TransactionRequest = {
      data,
      value,
      gasLimit
    };
    return this.wallet.sendTransaction(transaction);
  }

  public callContract(data: string, contractAddress: string, gasLimit: string) {
    const transaction: TransactionRequest = {
      data,
      to: contractAddress,
      gasLimit
    };
    return this.wallet.sendTransaction(transaction);
  }
}
