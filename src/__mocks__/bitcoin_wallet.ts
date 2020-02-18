import { BitcoinWallet } from "../bitcoin_wallet";

export class MockBitcoinWallet implements BitcoinWallet {
  public broadcastTransaction(
    // @ts-ignore
    transactionHex: string,
    // @ts-ignore
    network: string
  ): Promise<string> {
    return Promise.resolve("");
  }

  public getAddress(): Promise<string> {
    return Promise.resolve("");
  }

  public getBalance(): Promise<number> {
    return Promise.resolve(0);
  }

  public getFee(): string {
    return "";
  }

  // @ts-ignore
  public sendToAddress(
    // @ts-ignore
    address: string,
    // @ts-ignore
    satoshis: number,
    // @ts-ignore
    network: string
  ): Promise<string> {
    return Promise.resolve("");
  }
}
