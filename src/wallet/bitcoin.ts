import axios, { AxiosInstance, Method } from "axios";
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
      data: {
        jsonrpc: "1.0",
        method: "getnewaddress",
        params: ["", "bech32"]
      }
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
