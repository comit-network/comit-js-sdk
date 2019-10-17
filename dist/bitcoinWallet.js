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
    constructor(network, 
    // @ts-ignore
    walletdb, pool, 
    // @ts-ignore
    chain, wallet) {
        this.network = network;
        this.walletdb = walletdb;
        this.pool = pool;
        this.chain = chain;
        this.wallet = wallet;
    }
    static newInstance(network, peerUri, hdKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedNetwork = bcoin_1.Network.get(network);
            const logger = new blgr_1.default({
                level: "warning"
            });
            const walletdb = new bcoin_1.WalletDB({
                memory: true,
                witness: true,
                logger,
                network: parsedNetwork
            });
            const chain = new bcoin_1.Chain({
                spv: true,
                logger,
                network: parsedNetwork
            });
            const pool = new bcoin_1.Pool({
                chain,
                logger
            });
            yield logger.open();
            yield pool.open();
            yield walletdb.open();
            yield chain.open();
            yield pool.connect();
            const wallet = yield walletdb.create({
                logger,
                network: parsedNetwork,
                master: hdKey
            });
            const account = yield wallet.getAccount(0);
            for (let i = 0; i < 100; i++) {
                pool.watchAddress(yield account.deriveReceive(i).getAddress());
                pool.watchAddress(yield account.deriveChange(i).getAddress());
            }
            pool.startSync();
            pool.on("tx", (tx) => {
                walletdb.addTX(tx);
            });
            pool.on("block", (block) => {
                walletdb.addBlock(block);
                if (block.txs.length > 0) {
                    block.txs.forEach((tx) => {
                        walletdb.addTX(tx);
                    });
                }
            });
            const netAddr = yield pool.hosts.addNode(peerUri);
            const peer = pool.createOutbound(netAddr);
            pool.peers.add(peer);
            return new BitcoinWallet(parsedNetwork, walletdb, pool, chain, wallet);
        });
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const balance = yield this.wallet.getBalance();
            // TODO: Balances stay unconfirmed, try to use bcoin.SPVNode (and set node.http to undefined) see if it catches the confirmations
            const amount = new bcoin_1.Amount(balance.toJSON().unconfirmed, "sat");
            return amount.toBTC();
        });
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const receiveAddress = yield this.wallet.receiveAddress(0);
            return receiveAddress.toString(this.network);
        });
    }
    sendToAddress(address, satoshis, network) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNetwork(network);
            const transaction = yield this.wallet.send({
                witness: true,
                outputs: [
                    {
                        address,
                        value: satoshis
                    }
                ]
            });
            yield this.pool.broadcast(transaction);
            return transaction.hash("hex");
        });
    }
    broadcastTransaction(transactionHex, network) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNetwork(network);
            const transaction = bcoin_1.TX.fromRaw(transactionHex, "hex");
            yield this.pool.broadcast(transaction);
            return transaction.hash("hex");
        });
    }
    getFee() {
        // should be dynamic in a real application
        return "150";
    }
    assertNetwork(network) {
        if (network !== this.network.type) {
            throw new Error(`This wallet is only connected to the ${this.network.type} network and cannot perform actions on the ${network} network`);
        }
    }
}
exports.BitcoinWallet = BitcoinWallet;
//# sourceMappingURL=bitcoinWallet.js.map