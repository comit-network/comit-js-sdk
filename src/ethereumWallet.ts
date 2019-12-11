import { BigNumber } from "bignumber.js";
import { Contract, ethers, Wallet } from "ethers";
import { TransactionRequest } from "ethers/providers";
import {
  Arrayish,
  BigNumber as BigNumberEthers,
  ParamType,
  SigningKey
} from "ethers/utils";
import { HDNode } from "ethers/utils/hdnode";
import erc20 from "../ethereum_abi/erc20.json";

export class EthereumWallet {
  private readonly wallet: Wallet;

  public constructor(jsonRpcUrl: string, key?: SigningKey | HDNode | Arrayish) {
    const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    const wallet = key ? new ethers.Wallet(key) : ethers.Wallet.createRandom();

    this.wallet = wallet.connect(provider);
  }

  public getAccount() {
    return this.wallet.address;
  }

  public getBalance() {
    return this.wallet.getBalance();
  }

  public async getErc20Balance(
    contractAddress: string,
    decimals?: number
  ): Promise<BigNumber> {
    const abi = erc20 as ParamType[];
    const contract = new Contract(contractAddress, abi, this.wallet.provider);

    let dec;
    if (decimals === undefined) {
      try {
        dec = await contract.decimals();
      } catch (e) {
        // decimals() not present on token contract, defaulting to 18
        dec = 18;
      }
    } else {
      dec = decimals;
    }

    const strBalance = await contract.balanceOf(this.wallet.address);
    const intBalance = new BigNumber(strBalance);
    return intBalance.div(new BigNumber(10).pow(dec));
  }

  public async deployContract(
    data: string,
    amount: BigNumber,
    gasLimit: string
  ) {
    const value = new BigNumberEthers(amount.toString());
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
