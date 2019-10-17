"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
class EthereumWallet {
    constructor(key, jsonRpcUrl) {
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(jsonRpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(key).connect(provider);
    }
    getAccount() {
        return this.wallet.address;
    }
    getBalance() {
        return this.wallet.getBalance();
    }
    deployContract(data, value, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = {
                data,
                value,
                gasLimit
            };
            const response = yield this.wallet.sendTransaction(transaction);
            return response.hash;
        });
    }
    callContract(data, contractAddress, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = {
                data,
                to: contractAddress,
                gasLimit
            };
            const response = yield this.wallet.sendTransaction(transaction);
            return response.hash;
        });
    }
}
exports.EthereumWallet = EthereumWallet;
//# sourceMappingURL=ethereumWallet.js.map