import { Amount, Chain, Pool, TX, WalletDB } from "bcoin";
import Logger from "blgr";

export class BitcoinWallet {
  public readonly network: any;
  private readonly walletdb: any;
  private wallet: any;
  private address: any;
  private readonly pool: any;
  private readonly chain: any;
  private readonly logger: any;

  constructor(network: string) {
    this.logger = new Logger({
      level: "warning"
    });
    this.walletdb = new WalletDB({
      network,
      memory: true,
      witness: true,
      logger: this.logger
    });
    this.network = network;
    this.chain = new Chain({
      spv: true,
      network,
      logger: this.logger
    });
    this.pool = new Pool({
      chain: this.chain,
      network,
      logger: this.logger
    });
  }

  public async init(peerUri: string) {
    await this.logger.open();
    await this.pool.open();
    await this.walletdb.open();
    await this.chain.open();
    await this.pool.connect();
    this.wallet = await this.walletdb.create({
      logger: this.logger,
      network: this.network
    });
    this.address = await this.wallet.receiveAddress();

    this.pool.watchAddress(this.address);
    this.pool.startSync();

    this.pool.on("tx", (tx: any) => {
      this.walletdb.addTX(tx);
    });

    this.pool.on("block", (block: any) => {
      this.walletdb.addBlock(block);
      if (block.txs.length > 0) {
        block.txs.forEach((tx: any) => {
          this.walletdb.addTX(tx);
        });
      }
    });

    const netAddr = await this.pool.hosts.addNode(peerUri);
    const peer = this.pool.createOutbound(netAddr);
    this.pool.peers.add(peer);
  }

  public async getBalance() {
    this.isInit();
    const balance = await this.wallet.getBalance();
    // TODO: Balances stay unconfirmed, try to use bcoin.SPVNode (and set node.http to undefined) see if it catches the confirmations
    const amount = new Amount(balance.toJSON().unconfirmed, "sat");
    return amount.toBTC();
  }

  public getAddress() {
    this.isInit();
    return this.address.toString(this.network);
  }

  public async sendToAddress(
    address: string,
    satoshis: number,
    network: string
  ) {
    this.isInit();
    this.assertNetwork(network);

    const tx = await this.wallet.send({
      witness: true,
      outputs: [
        {
          address,
          value: satoshis
        }
      ]
    });
    const broadcast = await this.pool.broadcast(tx);
    return { tx, broadcast };
  }

  public async broadcastTransaction(transactionHex: string, network: string) {
    this.assertNetwork(network);

    const transaction = TX.fromRaw(transactionHex, "hex");
    return this.pool.broadcast(transaction);
  }

  private isInit() {
    if (!this.wallet) {
      throw new Error("Bitcoin wallet is not initialized");
    }
  }

  private assertNetwork(network: string) {
    if (network !== this.network) {
      throw new Error(
        `This wallet is only connected to the ${this.network} network and cannot perform actions on the ${network} network`
      );
    }
  }
}
