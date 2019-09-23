import { ethers } from "ethers";
import { BigNumber } from "ethers/utils";
export declare class EthereumWallet {
    private readonly wallet;
    constructor(hdKey: string);
    getAccount(): string;
    getBalance(): Promise<ethers.utils.BigNumber>;
    deployContract(data: string, value: BigNumber, gasLimit: string): Promise<ethers.providers.TransactionResponse>;
    callContract(data: string, contractAddress: string, gasLimit: string): Promise<ethers.providers.TransactionResponse>;
}
