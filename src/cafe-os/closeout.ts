import type { CafeStore } from './orderCore';

/** Pure accounting snapshot. Monetary amounts are integer satang.
 * This is an in-memory prototype, not a fiscal ledger or a payment provider.
 */
export interface CafeCloseout {
  grossSalesSatang: number;
  refundsSatang: number;
  netSalesSatang: number;
  recordedCashSatang: number;
  discrepancySatang: number;
  paidOrders: number;
  refundedOrders: number;
  cancelledOrders: number;
  consumedCancelledOrders: number;
}
export function closeCafeDay(store: CafeStore): CafeCloseout {
  let grossSalesSatang = 0, refundsSatang = 0;
  let paidOrders = 0, refundedOrders = 0, cancelledOrders = 0, consumedCancelledOrders = 0;
  for (const order of store.orders) {
    if (order.paymentRecorded) {
      paidOrders++;
      grossSalesSatang += order.paidSatang;
    }
    if (order.refundedSatang !== undefined) {
      refundedOrders++;
      refundsSatang += order.refundedSatang;
    }
    if (order.status === 'cancelled') {
      cancelledOrders++;
      if (order.stockConsumed) consumedCancelledOrders++;
    }
  }
  const netSalesSatang = grossSalesSatang - refundsSatang;
  return {
    grossSalesSatang, refundsSatang, netSalesSatang,
    recordedCashSatang: store.cashSatang,
    discrepancySatang: store.cashSatang - netSalesSatang,
    paidOrders, refundedOrders, cancelledOrders, consumedCancelledOrders,
  };
}
