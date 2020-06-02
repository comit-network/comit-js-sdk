import { Step, SwapAction } from "./cnd/swaps_payload";
import { Swap } from "./swap";
import { Transaction } from "./transaction";
/**
 * An executable action.
 */
export declare class Action {
    private action;
    private swap;
    constructor(action: SwapAction, swap: Swap);
    get name(): Step;
    /**
     * Execute the action.
     *
     * @throws A {@link Problem} from the cnd REST API, or {@link WalletError} if the blockchain wallet throws, or an {@link Error}.
     */
    execute(): Promise<Transaction | string>;
}
