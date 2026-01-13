"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptimizeRequest = validateOptimizeRequest;
const date_1 = require("../utils/date");
function isFiniteNumber(n) {
    return typeof n === "number" && Number.isFinite(n);
}
function isNonEmptyString(s) {
    return typeof s === "string" && s.trim().length > 0;
}
function validateOrder(o, idx) {
    const errors = [];
    if (!isNonEmptyString(o?.id))
        errors.push(`orders[${idx}].id is required`);
    if (!Number.isInteger(o?.payout_cents) || o.payout_cents < 0)
        errors.push(`orders[${idx}].payout_cents must be a non-negative integer`);
    if (!isFiniteNumber(o?.weight_lbs) || o.weight_lbs <= 0)
        errors.push(`orders[${idx}].weight_lbs must be > 0`);
    if (!isFiniteNumber(o?.volume_cuft) || o.volume_cuft <= 0)
        errors.push(`orders[${idx}].volume_cuft must be > 0`);
    if (!isNonEmptyString(o?.origin))
        errors.push(`orders[${idx}].origin is required`);
    if (!isNonEmptyString(o?.destination))
        errors.push(`orders[${idx}].destination is required`);
    if (!isNonEmptyString(o?.pickup_date))
        errors.push(`orders[${idx}].pickup_date is required`);
    if (!isNonEmptyString(o?.delivery_date))
        errors.push(`orders[${idx}].delivery_date is required`);
    if (typeof o?.is_hazmat !== "boolean")
        errors.push(`orders[${idx}].is_hazmat must be boolean`);
    // time validity: pickup_date <= delivery_date (document simplification)
    const p = (0, date_1.toDayNumber)(o?.pickup_date);
    const d = (0, date_1.toDayNumber)(o?.delivery_date);
    if (!Number.isFinite(p))
        errors.push(`orders[${idx}].pickup_date must be YYYY-MM-DD`);
    if (!Number.isFinite(d))
        errors.push(`orders[${idx}].delivery_date must be YYYY-MM-DD`);
    if (Number.isFinite(p) && Number.isFinite(d) && p > d)
        errors.push(`orders[${idx}] invalid window: pickup_date > delivery_date`);
    return errors;
}
function validateOptimizeRequest(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
        return { ok: false, errors: ["Request body must be a JSON object"] };
    }
    const truck = body.truck;
    const orders = body.orders;
    if (!truck || typeof truck !== "object") {
        errors.push("truck is required");
    }
    else {
        if (!isNonEmptyString(truck.id))
            errors.push("truck.id is required");
        if (!isFiniteNumber(truck.max_weight_lbs) || truck.max_weight_lbs <= 0)
            errors.push("truck.max_weight_lbs must be > 0");
        if (!isFiniteNumber(truck.max_volume_cuft) || truck.max_volume_cuft <= 0)
            errors.push("truck.max_volume_cuft must be > 0");
    }
    if (!Array.isArray(orders)) {
        errors.push("orders must be an array");
    }
    else {
        if (orders.length > 22)
            errors.push("orders length must be <= 22");
        orders.forEach((o, i) => errors.push(...validateOrder(o, i)));
    }
    if (errors.length > 0)
        return { ok: false, errors };
    // Safe cast after validation
    return { ok: true, value: { truck, orders: orders } };
}
