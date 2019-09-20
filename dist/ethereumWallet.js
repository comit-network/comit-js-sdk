"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
class EthereumWallet {
    constructor() {
        const provider = new ethers_1.ethers.providers.JsonRpcProvider("http://localhost:8545");
        this.wallet = ethers_1.ethers.Wallet.createRandom().connect(provider);
    }
    getAccount() {
        return this.wallet.address;
    }
    getBalance() {
        return this.wallet.getBalance();
    }
    deployContract(data, value, gasLimit) {
        const transaction = {
            data,
            value,
            gasLimit
        };
        return this.wallet.sendTransaction(transaction);
    }
    callContract(data, contractAddress, gasLimit) {
        const transaction = {
            data,
            to: contractAddress,
            gasLimit
        };
        return this.wallet.sendTransaction(transaction);
    }
}
exports.EthereumWallet = EthereumWallet;
//# sourceMappingURL=ethereumWallet.js.map