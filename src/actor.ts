import { BitcoinWallet } from "./bitcoin_wallet";
import { Cnd } from "./cnd";
import { ComitClient } from "./comit_client";
import { EthereumWallet } from "./ethereum_wallet";

export interface Actor {
  name?: string;
  comitClient: ComitClient;
  peerId: string;
  addressHint: string;
  bitcoinWallet: BitcoinWallet;
  ethereumWallet: EthereumWallet;
}

export async function createActor(
  bitcoinWallet: BitcoinWallet,
  ethereumWallet: EthereumWallet,
  cndUrl: string,
  name?: string
): Promise<Actor> {
  const cnd = new Cnd(cndUrl!);
  const peerId = await cnd.getPeerId();
  const addressHint = await cnd
    .getPeerListenAddresses()
    .then(addresses => addresses[0]);

  const comitClient = new ComitClient(cnd);
  comitClient.ethereumWallet = ethereumWallet;
  comitClient.bitcoinWallet = bitcoinWallet;

  return {
    name,
    comitClient,
    peerId,
    addressHint,
    bitcoinWallet,
    ethereumWallet
  };
}
