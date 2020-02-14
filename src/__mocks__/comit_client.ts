import { BitcoinWallet } from "../bitcoin_wallet";
import { Cnd, SwapRequest } from "../cnd";
import { EthereumWallet } from "../ethereum_wallet";
import { Swap } from "../swap";

export class ComitClient {
  public bitcoinWallet?: BitcoinWallet;
  public ethereumWallet?: EthereumWallet;

  constructor(
    // @ts-ignore
    private readonly cnd: Cnd
  ) {}

  // @ts-ignore
  public async sendSwap(swapRequest: SwapRequest): Promise<Swap> {
    throw new Error("sendSwap");
  }

  public async getNewSwaps(): Promise<Swap[]> {
    throw new Error("getNewSwaps");
  }

  public async getOngoingSwaps(): Promise<Swap[]> {
    throw new Error("getOngoingSwaps");
  }

  public async getDoneSwaps(): Promise<Swap[]> {
    throw new Error("getDoneSwaps");
  }

  public getPeerId(): Promise<string> {
    throw new Error("getPeerId");
  }

  public getPeerListenAddresses(): Promise<string[]> {
    throw new Error("getPeerListenAddresses");
  }

  // @ts-ignore
  public async retrieveSwapById(swapId: string): Promise<Swap | undefined> {
    throw new Error("retrieveSwapById");
  }
}
