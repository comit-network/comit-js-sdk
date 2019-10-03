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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const urijs_1 = __importDefault(require("urijs"));
const actionToHttpRequest_1 = __importDefault(require("./actionToHttpRequest"));
/**
 * Facilitates access to the cnd REST API
 */
class Cnd {
    constructor(cndUrl) {
        this.cndUrl = cndUrl;
    }
    getPeerId() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.getInfo();
            if (!info.id) {
                throw new Error("id field not present");
            }
            return info.id;
        });
    }
    getPeerListenAddresses() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.getInfo();
            if (!info.listen_addresses) {
                throw new Error("listen addresses field not present");
            }
            return info.listen_addresses;
        });
    }
    postSwap(swap) {
        return __awaiter(this, void 0, void 0, function* () {
            return axios_1.default
                .post(this.rootUrl()
                .path("swaps/rfc003")
                .toString(), swap)
                .then(res => res.data.id);
        });
    }
    getSwaps() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(this.rootUrl()
                .path("swaps")
                .toString());
            const entity = response.data;
            return entity.entities;
        });
    }
    executeAction(action, resolver) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield actionToHttpRequest_1.default(action, resolver);
            return axios_1.default.request(Object.assign({ baseURL: this.cndUrl }, request));
        });
    }
    getSwap(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(this.rootUrl()
                .path("swaps/rfc003/")
                .segment(id)
                .toString());
            return response.data;
        });
    }
    rootUrl() {
        return new urijs_1.default(this.cndUrl);
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(this.rootUrl().toString());
            return response.data;
        });
    }
}
exports.Cnd = Cnd;
//# sourceMappingURL=cnd.js.map