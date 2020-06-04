import { Transaction, TransactionStatus } from "./transaction";
import { EthereumWallet } from "./wallet/ethereum";

const defaultEthereumWallet = new EthereumWallet("");

describe("Transaction", () => {
  it("returns failed for a failed Ethereum transaction", async () => {
    const transaction = new Transaction(
      { ethereum: defaultEthereumWallet },
      ""
    );

    defaultEthereumWallet.getTransaction = jest.fn().mockImplementation(() => {
      return {
        confirmations: 1
      };
    });

    defaultEthereumWallet.getTransactionReceipt = jest
      .fn()
      .mockImplementation(() => {
        return {
          status: 0
        };
      });

    const status = await transaction.status();

    expect(status).toEqual(TransactionStatus.Failed);
  });

  it("returns pending for an unconfirmed Ethereum transaction", async () => {
    const transaction = new Transaction(
      { ethereum: defaultEthereumWallet },
      ""
    );

    defaultEthereumWallet.getTransaction = jest.fn().mockImplementation(() => {
      return {
        confirmations: 0
      };
    });

    const status = await transaction.status();

    expect(status).toEqual(TransactionStatus.Pending);
  });

  it("returns confirmed for a mined Ethereum transaction", async () => {
    const transaction = new Transaction(
      { ethereum: defaultEthereumWallet },
      ""
    );

    defaultEthereumWallet.getTransaction = jest.fn().mockImplementation(() => {
      return {
        confirmations: 1
      };
    });

    defaultEthereumWallet.getTransactionReceipt = jest
      .fn()
      .mockImplementation(() => {
        return {
          status: 1
        };
      });

    const status = await transaction.status();

    expect(status).toEqual(TransactionStatus.Confirmed);
  });
});
