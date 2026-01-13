# SmartLoad Optimization API

This service implements the **Optimal Truck Load Planner** as described in the coding assessment.
It selects the optimal combination of orders for a truck while respecting capacity and compatibility constraints.

---

## Tech Stack

- Node.js 18+
- TypeScript
- Express.js
- Stateless (in-memory only)
- Docker & Docker Compose

---

## Features

- Maximizes total payout (integer cents only)
- Enforces truck weight & volume limits
- Route compatibility (origin → destination lane)
- Hazmat isolation (hazmat orders are not mixed with non-hazmat)
- Time-window compatibility  
  (`max(pickup_date) <= min(delivery_date)`)
- Deterministic optimization using subset DP (n ≤ 22)
- Runs under required performance limits

---

## How to Run

### Prerequisites
- Docker
- Docker Compose

### Build & Start the Service
```bash
docker compose up --build
