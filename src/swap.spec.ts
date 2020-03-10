import nock = require("nock");
import { Problem } from "./cnd/axios_rfc7807_middleware";
import { Cnd, LedgerAction, SwapDetails } from "./cnd/cnd";
import { ChainError, Swap } from "./swap";

describe("Swap", () => {
  it("Throws a problem if cnd returns an error when executing an action", async () => {
    const basePath = "http://example.com";
    const cnd = new Cnd(basePath);

    const selfPath = "/swap-id";

    const swap = new Swap(cnd, selfPath, {});

    const scope = nock(basePath)
      .get(selfPath)
      .reply(
        400,
        JSON.stringify({
          status: "400",
          title: "Swap not supported",
          type: "about:blank",
          detail:
            "The requested combination of ledgers and assets is not supported."
        }),
        {
          "content-type": "application/problem+json"
        }
      );

    const promise = swap.tryExecuteSirenAction("action", {
      maxTimeoutSecs: 1,
      tryIntervalSecs: 0.01
    });

    await expect(promise).rejects.toBeInstanceOf(Problem);

    return scope;
  });

  it("Throws a ChainError if a wallet returns an error when resolving fields", async () => {
    const basePath = "http://example.com";
    const cnd = new Cnd(basePath);

    const selfPath = "/swap-id";

    const swap = new Swap(cnd, `${basePath}/swap-id`, {});

    const swapDetails: SwapDetails = {
      actions: [
        {
          href: "/swap-id/action",
          name: "action",
          method: "GET",
          fields: [{ name: "address", class: ["bitcoin", "address"] }]
        }
      ]
    };

    const scope = nock(basePath)
      .get(selfPath)
      .reply(200, JSON.stringify(swapDetails), {});

    const promise = swap.tryExecuteSirenAction("action", {
      maxTimeoutSecs: 1,
      tryIntervalSecs: 0.01
    });

    await expect(promise).rejects.toBeInstanceOf(ChainError);

    return scope;
  });

  it("Throws a ChainError if a wallet returns an error when executing an action", async () => {
    const basePath = "http://example.com";
    const cnd = new Cnd(basePath);

    const selfPath = "/swap-id";

    const swap = new Swap(cnd, `${basePath}/swap-id`, {});

    const swapDetails: SwapDetails = {
      actions: [
        {
          href: "/swap-id/deploy",
          name: "deploy",
          method: "GET"
        }
      ]
    };

    const swapScope = nock(basePath)
      .get(selfPath)
      .times(2)
      .reply(200, JSON.stringify(swapDetails), {});

    const actionPayload = {
      type: "ethereum-deploy-contract",
      payload: {
        data: "",
        amount: "",
        gas_limit: "",
        network: ""
      }
    };

    const actionScope = nock(basePath)
      .get("/swap-id/deploy")
      .times(2)
      .reply(200, JSON.stringify(actionPayload), {});

    const tryParams = {
      maxTimeoutSecs: 1,
      tryIntervalSecs: 0.01
    };

    // To be sure we are testing the right thing, we verify this does not throws
    const executeActionPromise = swap.tryExecuteSirenAction<LedgerAction>(
      "deploy",
      tryParams
    );
    await expect(executeActionPromise).resolves;

    const promise = swap.deploy(tryParams);

    await expect(promise).rejects.toBeInstanceOf(ChainError);

    return { swapScope, actionScope };
  });
});
