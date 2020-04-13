import axios, { AxiosInstance, Method } from "axios";
import { Amount, Chain, Network, Pool, TX, WalletDB } from "bcoin";
import Logger from "blgr";
import { toBitcoin } from "satoshi-bitcoin";

/**
 * Interface defining the Bitcoin wallet functionalities needed by the SDK to execute a swap involving Bitcoin.
 * It is expected from a COMIT App developer to write their own class that would implement this interface.
 * Depending on the use case and platform, such class could interact with a hardware wallet API, display QR codes,
 * take input via text fields, etc.
 */
export interface BitcoinWallet {
  getAddress(): Promise<string>;

  getBalance(): Promise<number>;

  sendToAddress(
    address: string,
    satoshis: number,
    network: Network
  ): Promise<string>;

  broadcastTransaction(
    transactionHex: string,
    network: Network
  ): Promise<string>;

  getFee(): string;
}

export interface BitcoindWalletArgs {
  url: string;
  username: string;
  password: string;
  walletDescriptor: string;
  walletName: string;
  rescan?: boolean;
}

/**
 * Instance of a bitcoind 0.19.1 wallet.
 *
 * This is to be used for demos, examples and dev environment only. No safeguards are applied, no data is written on
 * the disk. This is not to be used for mainnet, instead, implement your own {@link BitcoinWallet}
 */
export class BitcoindWallet implements BitcoinWallet {
  public static async newInstance({
    url,
    username,
    password,
    walletDescriptor,
    walletName,
    rescan
  }: BitcoindWalletArgs): Promise<BitcoindWallet> {
    const auth = { username, password };
    const client = axios.create({
      url,
      method: "post" as Method,
      auth
    });

    const walletExists = await client
      .request({
        data: {
          jsonrpc: "1.0",
          method: "listwallets"
        }
      })
      .then(res => res.data.result.includes(walletName));

    if (!walletExists) {
      await client.request({
        data: {
          jsonrpc: "1.0",
          method: "createwallet",
          params: [walletName]
        }
      });
    }

    if (rescan === undefined) {
      rescan = !walletExists;
    }

    // Ask bitcoind for a checksum if none was provided with the descriptor
    if (!hasChecksum(walletDescriptor)) {
      const checksum = await client
        .request({
          data: {
            jsonrpc: "1.0",
            method: "getdescriptorinfo",
            params: [walletDescriptor]
          }
        })
        .then(res => res.data.result.chekcsum);
      walletDescriptor = `${walletDescriptor}#${checksum}`;
    }

    const walletClient = axios.create({
      url: `${url}/wallet/${walletName}`,
      method: "post" as Method,
      auth
    });

    await walletClient.request({
      data: {
        jsonrpc: "1.0",
        method: "importmulti",
        params: [
          [{ desc: walletDescriptor, timestamp: 0, range: 0 }],
          { rescan }
        ]
      }
    });

    return new BitcoindWallet(walletClient);
  }

  private constructor(private rpcClient: AxiosInstance) {}

  public async getBalance(): Promise<number> {
    const res = await this.rpcClient.request({
      data: { jsonrpc: "1.0", method: "getbalance", params: [] }
    });
    return res.data.result;
  }

  public async getAddress(): Promise<string> {
    const res = await this.rpcClient.request({
      data: { jsonrpc: "1.0", method: "getnewaddress", params: [] }
    });

    return res.data.result;
  }

  public async sendToAddress(
    address: string,
    satoshis: number,
    network: Network
  ): Promise<string> {
    await this.assertNetwork(network);

    const res = await this.rpcClient.request({
      data: {
        jsonrpc: "1.0",
        method: "sendtoaddress",
        params: [address, toBitcoin(satoshis)]
      }
    });

    return res.data.result;
  }

  public async broadcastTransaction(
    transactionHex: string,
    network: Network
  ): Promise<string> {
    await this.assertNetwork(network);

    const res = await this.rpcClient.request({
      data: {
        jsonrpc: "1.0",
        method: "sendrawtransaction",
        params: [transactionHex]
      }
    });

    return res.data.result;
  }

  public getFee(): string {
    // should be dynamic in a real application
    return "150";
  }

  public async close(): Promise<void> {
    await this.rpcClient.request({
      data: {
        jsonrpc: "1.0",
        method: "unloadwallet",
        params: []
      }
    });
  }

  private async assertNetwork(network: Network): Promise<void> {
    const res = await this.rpcClient.request({
      data: { jsonrpc: "1.0", method: "getblockchaininfo", params: [] }
    });

    if (res.data.result.chain !== network) {
      return Promise.reject(
        `This wallet is only connected to the ${network} network and cannot perform actions on the ${network} network`
      );
    }
  }
}

export type Network = "main" | "test" | "regtest";

function hasChecksum(descriptor: string): boolean {
  const [, checksum] = descriptor.split("#", 2);

  return !!checksum && checksum.length === 8;
}

/**
 * Dummy Bitcoin wallet based on [bcoin]{@link https://github.com/bcoin-org/bcoin}.
 *
 * This is to be used for demos, examples and dev environment only. No safeguards are applied, no data is written on
 * the disk.
 * This is not to be used for mainnet, instead, implement your own {@link BitcoinWallet}
 *
 * @deprecated since version 0.15.2.
 * Will be removed in version 0.16.0.
 *
 * Use {@link BitcoindWallet} instead or implement your own {@link BitcoinWallet}.
 */
export class InMemoryBitcoinWallet implements BitcoinWallet {
  /**
   * @deprecated since version 0.15.2.
   * Will be removed in version 0.16.0.
   */
  public static async newInstance(
    network: string,
    peerUri: string,
    hdKey: string
  ): Promise<InMemoryBitcoinWallet> {
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

    private readonly walletdb: any,
    private readonly pool: any,

    private readonly chain: any,
    private readonly wallet: any
  ) {}

  public async getBalance(): Promise<number> {
    const balance = await this.wallet.getBalance();
    // TODO: Balances stay unconfirmed, try to use bcoin.SPVNode (and set node.http to undefined) see if it catches the confirmations
    const amount = new Amount(balance.toJSON().unconfirmed, "sat");
    return amount.toBTC(true);
  }

  public async getAddress(): Promise<string> {
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

  public getFee(): string {
    // should be dynamic in a real application
    return "150";
  }

  /**
   * @deprecated since version 0.15.2.
   * Will be removed in version 0.16.0.
   */
  public async close(): Promise<void> {
    const tasks = [];
    if (this.pool.opened) {
      tasks.push(this.pool.close());
    }

    if (this.chain.opened) {
      tasks.push(this.chain.close());
    }

    if (this.walletdb.opened) {
      tasks.push(this.walletdb.close());
    }

    await Promise.all(tasks);
  }

  private assertNetwork(network: string): void {
    if (network !== this.network.type) {
      throw new Error(
        `This wallet is only connected to the ${this.network.type} network and cannot perform actions on the ${network} network`
      );
    }
  }
}
