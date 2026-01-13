"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const request_validator_1 = require("../validators/request.validator");
const optimizer_service_1 = require("../services/optimizer.service");
const router = (0, express_1.Router)();
router.post("/optimize", (req, res) => {
    const validated = (0, request_validator_1.validateOptimizeRequest)(req.body);
    if (!validated.ok) {
        return res.status(400).json({ error: "Invalid input", details: validated.errors });
    }
    const { truck, orders } = validated.value;
    const result = (0, optimizer_service_1.optimize)(truck, orders);
    return res.status(200).json(result);
});
exports.default = router;
