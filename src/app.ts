import express from "express";
import optimizerRoute from "./routes/optimizer.route";

const app = express();

// If payload too large, express will throw an error we catch below
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_, res) => res.status(200).json({ status: "ok" }));

app.use("/api/v1/load-optimizer", optimizerRoute);

// Error handler (map oversized payload to 413)
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }
  return res.status(500).json({ error: "Internal server error" });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`SmartLoad Optimization API listening on port ${PORT}`);
});
