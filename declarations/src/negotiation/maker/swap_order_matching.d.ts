import { SwapProperties } from "../..";
import { Order } from "../order";
/**
 * Check that a given swap matches the agreed conditions of an accepted order.
 * See: {@link MakerNegotiator}
 *
 * @param order - The order to check against the swap.
 * @param props - The properties of the the swap to check against the order.
 */
export default function match(order: Order, props: SwapProperties): boolean;
