"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const optimizer_route_1 = __importDefault(require("./routes/optimizer.route"));
const app = (0, express_1.default)();
// If payload too large, express will throw an error we catch below
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/healthz", (_, res) => res.status(200).json({ status: "ok" }));
app.use("/api/v1/load-optimizer", optimizer_route_1.default);
// Error handler (map oversized payload to 413)
app.use((err, _req, res, _next) => {
    if (err?.type === "entity.too.large") {
        return res.status(413).json({ error: "Payload too large" });
    }
    return res.status(500).json({ error: "Internal server error" });
});
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`SmartLoad Optimization API listening on port ${PORT}`);
});
