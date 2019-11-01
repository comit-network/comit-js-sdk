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
const swap_1 = require("./swap");
class ComitClient {
    constructor(bitcoinWallet, ethereumWallet, cnd) {
        this.bitcoinWallet = bitcoinWallet;
        this.ethereumWallet = ethereumWallet;
        this.cnd = cnd;
    }
    sendSwap(swapRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const swapLocation = yield this.cnd.postSwap(swapRequest);
            if (!swapLocation) {
                throw new Error("Problem creating swap, no swap location returned.");
            }
            const response = yield this.cnd.fetch(swapLocation);
            if (!response) {
                throw new Error(`Swap with location ${swapLocation} could not be retrieved.`);
            }
            return this.newSwap(response.data);
        });
    }
    getNewSwaps() {
        return __awaiter(this, void 0, void 0, function* () {
            const swaps = yield this.cnd.getSwaps();
            return swaps
                .filter((swap) => {
                return (swap.actions &&
                    !!swap.actions.find((action) => {
                        return action.name === "accept";
                    }));
            })
                .map(swap => this.newSwap(swap));
        });
    }
    getOngoingSwaps() {
        return __awaiter(this, void 0, void 0, function* () {
            const swaps = yield this.cnd.getSwaps();
            return swaps
                .filter((swap) => {
                return (swap.actions &&
                    !!swap.actions.find((action) => {
                        return action.name === "fund" || action.name === "redeem";
                    }));
            })
                .map(swap => this.newSwap(swap));
        });
    }
    getDoneSwaps() {
        return __awaiter(this, void 0, void 0, function* () {
            const swaps = yield this.cnd.getSwaps();
            return swaps
                .filter((swap) => {
                return (swap.properties &&
                    (swap.properties.status === "SWAPPED" ||
                        swap.properties.status === "NOT_SWAPPED" ||
                        swap.properties.status === "INTERNAL_FAILURE"));
            })
                .map(swap => this.newSwap(swap));
        });
    }
    getPeerId() {
        return this.cnd.getPeerId();
    }
    getPeerListenAddresses() {
        return this.cnd.getPeerListenAddresses();
    }
    newSwap(swap) {
        return new swap_1.Swap(this.bitcoinWallet, this.ethereumWallet, this.cnd, swap.links.find(link => link.rel.includes("self")).href);
    }
}
exports.ComitClient = ComitClient;
//# sourceMappingURL=comitClient.js.map