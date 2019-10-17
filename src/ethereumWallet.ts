import { ethers, Wallet } from "ethers";
import { TransactionRequest } from "ethers/providers";
import { Arrayish, BigNumber, SigningKey } from "ethers/utils";
import { HDNode } from "ethers/utils/hdnode";

export class EthereumWallet {
  private readonly wallet: Wallet;

  public constructor(key: SigningKey | HDNode | Arrayish, jsonRpcUrl: string) {
    const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    this.wallet = new ethers.Wallet(key).connect(provider);
  }

  public getAccount() {
    return this.wallet.address;
  }

  public getBalance() {
    return this.wallet.getBalance();
  }

  public async deployContract(
    data: string,
    value: BigNumber,
    gasLimit: string
  ) {
    const transaction: TransactionRequest = {
      data,
      value,
      gasLimit
    };
    const response = await this.wallet.sendTransaction(transaction);

    return response.hash;
  }

  public async callContract(
    data: string,
    contractAddress: string,
    gasLimit: string
  ) {
    const transaction: TransactionRequest = {
      data,
      to: contractAddress,
      gasLimit
    };
    const response = await this.wallet.sendTransaction(transaction);

    return response.hash;
  }
}
