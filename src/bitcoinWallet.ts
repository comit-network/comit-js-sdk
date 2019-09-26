import { Amount, Chain, Network, Pool, TX, WalletDB } from "bcoin";
import Logger from "blgr";

export class BitcoinWallet {
  public static async newInstance(
    network: string,
    peerUri: string,
    hdKey: string
  ) {
    const parsedNetwork = Network.get(network);

    const logger = new Logger({
      level: "warning"
    });
    const walletdb = new WalletDB({
      memory: true,
      witness: true,
      logger,
      network: parsedNetwork
    });
    const chain = new Chain({
      spv: true,
      logger,
      network: parsedNetwork
    });
    const pool = new Pool({
      chain,
      logger
    });

    await logger.open();
    await pool.open();
    await walletdb.open();
    await chain.open();
    await pool.connect();

    const wallet = await walletdb.create({
      logger,
      network: parsedNetwork,
      master: hdKey
    });

    const account = await wallet.getAccount(0);

    for (let i = 0; i < 100; i++) {
      const address = await account.receiveAddress();
      pool.watchAddress(address);
    }
    account.receiveDepth = 0;

    for (let i = 0; i < 100; i++) {
      const address = await account.changeAddress();
      pool.watchAddress(address);
    }
    account.changeDepth = 0;

    pool.startSync();

    pool.on("tx", (tx: any) => {
      walletdb.addTX(tx);
    });

    pool.on("block", (block: any) => {
      walletdb.addBlock(block);
      if (block.txs.length > 0) {
        block.txs.forEach((tx: any) => {
          walletdb.addTX(tx);
        });
      }
    });

    const netAddr = await pool.hosts.addNode(peerUri);
    const peer = pool.createOutbound(netAddr);
    pool.peers.add(peer);

    return new BitcoinWallet(parsedNetwork, walletdb, pool, chain, wallet);
  }

  private constructor(
    public readonly network: any,

    // @ts-ignore
    private readonly walletdb: any,
    private readonly pool: any,

    // @ts-ignore
    private readonly chain: any,
    private readonly wallet: any
  ) {}

  public async getBalance() {
    const balance = await this.wallet.getBalance();
    // TODO: Balances stay unconfirmed, try to use bcoin.SPVNode (and set node.http to undefined) see if it catches the confirmations
    const amount = new Amount(balance.toJSON().unconfirmed, "sat");
    return amount.toBTC();
  }

  public async getAddress() {
    const receiveAddress = await this.wallet.receiveAddress();
    this.pool.watchAddress(receiveAddress);

    return receiveAddress.toString(this.network);
  }

  public async sendToAddress(
    address: string,
    satoshis: number,
    network: string
  ) {
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

  private assertNetwork(network: string) {
    if (network !== this.network.type) {
      throw new Error(
        `This wallet is only connected to the ${this.network.type} network and cannot perform actions on the ${network} network`
      );
    }
  }
}
