import { Router, Request, Response } from "express";
import { validateOptimizeRequest } from "../validators/request.validator";
import { optimize } from "../services/optimizer.service";

const router = Router();

router.post("/optimize", (req: Request, res: Response) => {
  const validated = validateOptimizeRequest(req.body);
  if (!validated.ok) {
    return res.status(400).json({ error: "Invalid input", details: validated.errors });
  }

  const { truck, orders } = validated.value;

  const result = optimize(truck, orders);
  return res.status(200).json(result);
});

export default router;
