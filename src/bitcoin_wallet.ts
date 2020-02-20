import { Amount, Chain, Network, Pool, TX, WalletDB } from "bcoin";
import Logger from "blgr";

/**
 * Interface defining the Bitcoin wallet used in the SDK.
 * You can plug your own wallet by passing a custom implementation of this interface to the {@link ComitClient}.
 */
export interface BitcoinWallet {
  getAddress(): Promise<string>;

  getBalance(): Promise<number>;

  sendToAddress(
    address: string,
    satoshis: number,
    network: string
  ): Promise<string>;

  broadcastTransaction(
    transactionHex: string,
    network: string
  ): Promise<string>;

  getFee(): string;
}

/**
 * Simple Bitcoin wallet based on [bcoin]{@link https://github.com/bcoin-org/bcoin}.
 */
export class InMemoryBitcoinWallet implements BitcoinWallet {
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
      pool.watchAddress(await account.deriveReceive(i).getAddress());
      pool.watchAddress(await account.deriveChange(i).getAddress());
    }

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

    return new InMemoryBitcoinWallet(
      parsedNetwork,
      walletdb,
      pool,
      chain,
      wallet
    );
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
    return amount.toBTC(true);
  }

  public async getAddress() {
    const receiveAddress = await this.wallet.receiveAddress(0);
    return receiveAddress.toString(this.network);
  }

  public async sendToAddress(
    address: string,
    satoshis: number,
    network: string
  ): Promise<string> {
    this.assertNetwork(network);

    const transaction = await this.wallet.send({
      witness: true,
      outputs: [
        {
          address,
          value: satoshis
        }
      ]
    });
    await this.pool.broadcast(transaction);

    return transaction.txid();
  }

  public async broadcastTransaction(
    transactionHex: string,
    network: string
  ): Promise<string> {
    this.assertNetwork(network);

    const transaction = TX.fromRaw(transactionHex, "hex");

    await this.pool.broadcast(transaction);

    return transaction.txid();
  }

  public getFee() {
    // should be dynamic in a real application
    return "150";
  }

  private assertNetwork(network: string) {
    if (network !== this.network.type) {
      throw new Error(
        `This wallet is only connected to the ${this.network.type} network and cannot perform actions on the ${network} network`
      );
    }
  }
}
