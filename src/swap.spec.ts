import nock = require("nock");
import { Problem } from "./cnd/axios_rfc7807_middleware";
import { Cnd } from "./cnd/cnd";
import { Swap } from "./swap";

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
});
