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
const utils_1 = require("ethers/utils");
class Swap {
    constructor(bitcoinWallet, ethereumWallet, cnd, self) {
        this.bitcoinWallet = bitcoinWallet;
        this.ethereumWallet = ethereumWallet;
        this.cnd = cnd;
        this.self = self;
    }
    accept(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.tryExecuteAction("accept", params);
        });
    }
    decline(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.tryExecuteAction("decline", params);
        });
    }
    deploy(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.tryExecuteAction("deploy", params);
            return yield this.doLedgerAction(response.data);
        });
    }
    fund(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.tryExecuteAction("fund", params);
            return yield this.doLedgerAction(response.data);
        });
    }
    redeem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.tryExecuteAction("redeem", params);
            return yield this.doLedgerAction(response.data);
        });
    }
    refund(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.tryExecuteAction("refund", params);
            return yield this.doLedgerAction(response.data);
        });
    }
    tryExecuteAction(actionName, { timeout, tryInterval }) {
        return this.timeoutPromise(timeout, this.executeAction(actionName, tryInterval));
    }
    timeoutPromise(ms, promise) {
        const timeout = new Promise((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject("Timed out in " + ms + "ms.");
            }, ms);
        });
        return Promise.race([promise, timeout]);
    }
    executeAction(actionName, repeatInterval) {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                yield this.sleep(repeatInterval);
                const response = yield this.cnd.fetch(this.self);
                const swap = response.data;
                const actions = swap.actions;
                if (!actions || actions.length === 0) {
                    continue;
                }
                const action = actions.find(action => action.name === actionName);
                if (!action) {
                    continue;
                }
                return this.cnd.executeAction(action, (field) => this.fieldValueResolver(field));
            }
        });
    }
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    fieldValueResolver(field) {
        return __awaiter(this, void 0, void 0, function* () {
            const classes = field.class;
            if (classes.includes("bitcoin") && classes.includes("address")) {
                return this.bitcoinWallet.getAddress();
            }
            if (classes.includes("bitcoin") && classes.includes("feePerWU")) {
                return Promise.resolve(this.bitcoinWallet.getFee());
            }
            if (classes.includes("ethereum") && classes.includes("address")) {
                return Promise.resolve(this.ethereumWallet.getAccount());
            }
        });
    }
    doLedgerAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (action.type) {
                case "bitcoin-broadcast-signed-transaction": {
                    const { hex, network } = action.payload;
                    return yield this.bitcoinWallet.broadcastTransaction(hex, network);
                }
                case "bitcoin-send-amount-to-address": {
                    const { to, amount, network } = action.payload;
                    const sats = parseInt(amount, 10);
                    return yield this.bitcoinWallet.sendToAddress(to, sats, network);
                }
                case "ethereum-call-contract": {
                    const { data, contract_address, gas_limit } = action.payload;
                    return yield this.ethereumWallet.callContract(data, contract_address, gas_limit);
                }
                case "ethereum-deploy-contract": {
                    const { amount, data, gas_limit } = action.payload;
                    const value = new utils_1.BigNumber(amount);
                    return yield this.ethereumWallet.deployContract(data, value, gas_limit);
                }
            }
        });
    }
}
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map