import { Cnd } from "../cnd";
import { ComitClient } from "../comit_client";
import { TakerCriteria } from "./order";
import { TakerNegotiator } from "./taker_negotiator";

jest.mock("../comit_client");
jest.mock("./maker_client");

const defaultCnd = new Cnd("");
const defaultComitClient = new ComitClient(defaultCnd);

describe("Taker Negotiator", () => {
  it("Returns an order with the correct trading pair, given buy/sell input", async () => {
    const takerNegotiator = new TakerNegotiator(defaultComitClient, "");

    const takerCriteria: TakerCriteria = {
      buy: {
        asset: "bitcoin",
        ledger: "bitcoin",
        minNominalAmount: "2"
      },
      sell: {
        asset: "ether",
        ledger: "ethereum"
      }
    };

    const order = await takerNegotiator.getOrder(takerCriteria);

    expect(order).toHaveProperty("tradingPair", "ETH-BTC");
  });
});
