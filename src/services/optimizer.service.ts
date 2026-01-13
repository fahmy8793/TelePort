import { Order, Truck, OptimizeResponse } from "../types/models";
import { toDayNumber } from "../utils/date";

type LaneKey = string;

type SubsetInfo = {
  mask: number;          // subset mask within that half
  weight: number;
  volume: number;
  payout: bigint;        // integer cents (BigInt)
  maxPickup: number;     // day number
  minDelivery: number;   // day number
};

// ---- Compatibility rules (document-based assumptions) ----
// 1) Same origin+destination lane.
// 2) pickup_date <= delivery_date already validated.
// 3) "no overlapping time conflicts" simplified => require overall overlap:
//      max(pickup_dates) <= min(delivery_dates)
// 4) Hazmat isolation: do NOT mix hazmat and non-hazmat in same load.

function laneKey(o: Order): LaneKey {
  return `${o.origin} -> ${o.destination}`;
}

function computeUtilization(total: number, max: number): number {
  if (max <= 0) return 0;
  return Number(((total / max) * 100).toFixed(2));
}

function buildSubsetList(orders: Order[]): SubsetInfo[] {
  const n = orders.length;
  const list: SubsetInfo[] = [];

  // Start with empty subset
  list.push({
    mask: 0,
    weight: 0,
    volume: 0,
    payout: 0n,
    maxPickup: -Infinity,
    minDelivery: Infinity,
  });

  // Iteratively build subsets to avoid recursion overhead
  for (let i = 0; i < n; i++) {
    const o = orders[i];
    const p = toDayNumber(o.pickup_date);
    const d = toDayNumber(o.delivery_date);

    const currentLen = list.length;
    for (let j = 0; j < currentLen; j++) {
      const base = list[j];

      const next: SubsetInfo = {
        mask: base.mask | (1 << i),
        weight: base.weight + o.weight_lbs,
        volume: base.volume + o.volume_cuft,
        payout: base.payout + BigInt(o.payout_cents),
        maxPickup: Math.max(base.maxPickup, p),
        minDelivery: Math.min(base.minDelivery, d),
      };

      list.push(next);
    }
  }

  return list;
}

function bestForOrders(truck: Truck, orders: Order[]): { mask: number; payout: bigint; weight: number; volume: number } {
  // Meet-in-the-middle:
  // split into two halves of size <= 11 each.
  const n = orders.length;
  const mid = Math.floor(n / 2);
  const left = orders.slice(0, mid);
  const right = orders.slice(mid);

  const L = buildSubsetList(left);
  const R = buildSubsetList(right);

  let bestPayout = 0n;
  let bestMask = 0;
  let bestWeight = 0;
  let bestVolume = 0;

  // Brute combine (<= 2048 x 2048 = ~4M checks at worst)
  // Enforce:
  // - weight/volume limits
  // - time-window overlap rule: maxPickup <= minDelivery
  for (const a of L) {
    if (a.weight > truck.max_weight_lbs || a.volume > truck.max_volume_cuft) continue;

    for (const b of R) {
      const totalWeight = a.weight + b.weight;
      if (totalWeight > truck.max_weight_lbs) continue;

      const totalVolume = a.volume + b.volume;
      if (totalVolume > truck.max_volume_cuft) continue;

      const maxPickup = Math.max(a.maxPickup, b.maxPickup);
      const minDelivery = Math.min(a.minDelivery, b.minDelivery);

      // Empty subset has -Inf/Inf; allow it naturally
      if (maxPickup !== -Infinity && minDelivery !== Infinity && maxPickup > minDelivery) {
        continue;
      }

      const totalPayout = a.payout + b.payout;
      if (totalPayout > bestPayout) {
        bestPayout = totalPayout;
        // Combine masks: left in low bits, right shifted by mid
        bestMask = a.mask | (b.mask << mid);
        bestWeight = totalWeight;
        bestVolume = totalVolume;
      }
    }
  }

  return { mask: bestMask, payout: bestPayout, weight: bestWeight, volume: bestVolume };
}

function selectOrdersByMask(orders: Order[], mask: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < orders.length; i++) {
    if (mask & (1 << i)) ids.push(orders[i].id);
  }
  return ids;
}

export function optimize(truck: Truck, orders: Order[]): OptimizeResponse {
  // Step A: group by lane (route compatibility)
  const laneMap = new Map<LaneKey, Order[]>();
  for (const o of orders) {
    const key = laneKey(o);
    const arr = laneMap.get(key) ?? [];
    arr.push(o);
    laneMap.set(key, arr);
  }

  // Step B: For each lane, enforce hazmat isolation by optimizing:
  // - best among non-hazmat orders
  // - best among hazmat-only orders
  // Then choose best payout across all lanes.
  let globalBest: {
    selected_order_ids: string[];
    payout: bigint;
    weight: number;
    volume: number;
  } = { selected_order_ids: [], payout: 0n, weight: 0, volume: 0 };

  for (const laneOrders of laneMap.values()) {
    const nonHaz = laneOrders.filter(o => !o.is_hazmat);
    const haz = laneOrders.filter(o => o.is_hazmat);

    // Optimize non-hazmat subset
    if (nonHaz.length > 0) {
      const r = bestForOrders(truck, nonHaz);
      if (r.payout > globalBest.payout) {
        globalBest = {
          selected_order_ids: selectOrdersByMask(nonHaz, r.mask),
          payout: r.payout,
          weight: r.weight,
          volume: r.volume,
        };
      }
    }

    // Optimize hazmat-only subset
    if (haz.length > 0) {
      const r = bestForOrders(truck, haz);
      if (r.payout > globalBest.payout) {
        globalBest = {
          selected_order_ids: selectOrdersByMask(haz, r.mask),
          payout: r.payout,
          weight: r.weight,
          volume: r.volume,
        };
      }
    }
  }

  // Step C: Build response
  const totalPayoutCents = Number(globalBest.payout); // safe in typical test ranges
  const totalWeight = globalBest.weight;
  const totalVolume = globalBest.volume;

  return {
    truck_id: truck.id,
    selected_order_ids: globalBest.selected_order_ids,
    total_payout_cents: totalPayoutCents,
    total_weight_lbs: totalWeight,
    total_volume_cuft: totalVolume,
    utilization_weight_percent: computeUtilization(totalWeight, truck.max_weight_lbs),
    utilization_volume_percent: computeUtilization(totalVolume, truck.max_volume_cuft),
  };
}
