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
const bcoin_1 = require("bcoin");
const blgr_1 = __importDefault(require("blgr"));
class BitcoinWallet {
    constructor(network) {
        this.logger = new blgr_1.default({
            level: "warning"
        });
        this.walletdb = new bcoin_1.WalletDB({
            network,
            memory: true,
            witness: true,
            logger: this.logger
        });
        this.network = network;
        this.chain = new bcoin_1.Chain({
            spv: true,
            network,
            logger: this.logger
        });
        this.pool = new bcoin_1.Pool({
            chain: this.chain,
            network,
            logger: this.logger
        });
    }
    init(peerUri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logger.open();
            yield this.pool.open();
            yield this.walletdb.open();
            yield this.chain.open();
            yield this.pool.connect();
            this.wallet = yield this.walletdb.create({
                logger: this.logger,
                network: this.network
            });
            this.address = yield this.wallet.receiveAddress();
            this.pool.watchAddress(this.address);
            this.pool.startSync();
            this.pool.on("tx", (tx) => {
                this.walletdb.addTX(tx);
            });
            this.pool.on("block", (block) => {
                this.walletdb.addBlock(block);
                if (block.txs.length > 0) {
                    block.txs.forEach((tx) => {
                        this.walletdb.addTX(tx);
                    });
                }
            });
            const netAddr = yield this.pool.hosts.addNode(peerUri);
            const peer = this.pool.createOutbound(netAddr);
            this.pool.peers.add(peer);
        });
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isInit();
            const balance = yield this.wallet.getBalance();
            // TODO: Balances stay unconfirmed, try to use bcoin.SPVNode (and set node.http to undefined) see if it catches the confirmations
            const amount = new bcoin_1.Amount(balance.toJSON().unconfirmed, "sat");
            return amount.toBTC();
        });
    }
    getAddress() {
        this.isInit();
        return this.address.toString(this.network);
    }
    sendToAddress(address, satoshis, network) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isInit();
            this.assertNetwork(network);
            const tx = yield this.wallet.send({
                witness: true,
                outputs: [
                    {
                        address,
                        value: satoshis
                    }
                ]
            });
            const broadcast = yield this.pool.broadcast(tx);
            return { tx, broadcast };
        });
    }
    broadcastTransaction(transactionHex, network) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNetwork(network);
            const transaction = bcoin_1.TX.fromRaw(transactionHex, "hex");
            return this.pool.broadcast(transaction);
        });
    }
    isInit() {
        if (!this.wallet) {
            throw new Error("Bitcoin wallet is not initialized");
        }
    }
    assertNetwork(network) {
        if (network !== this.network) {
            throw new Error(`This wallet is only connected to the ${this.network} network and cannot perform actions on the ${network} network`);
        }
    }
}
exports.BitcoinWallet = BitcoinWallet;
//# sourceMappingURL=bitcoinWallet.js.map