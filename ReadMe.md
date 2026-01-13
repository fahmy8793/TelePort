# SmartLoad Optimization API

The **SmartLoad Optimization API** implements the **Optimal Truck Load Planner**.  
It selects the optimal combination of orders for a truck while respecting capacity and compatibility constraints.

---

## 🚀 Tech Stack

- Node.js 18+
- TypeScript
- Express.js
- Stateless (in-memory only)
- Docker & Docker Compose

---

## ✨ Features

- 📈 Maximizes total payout (integer cents only)  
- ⚖️ Enforces truck weight & volume limits  
- 🛣️ Route compatibility (origin → destination lane)  
- ☢️ Hazmat isolation (hazmat orders are not mixed with non-hazmat)  
- ⏱️ Time-window compatibility (`max(pickup_date) <= min(delivery_date)`)  
- 🔍 Deterministic optimization using subset DP (n ≤ 22)  
- ⚡ Runs under required performance limits  

---

## 🛠️ How to Run

### Prerequisites
- Docker
- Docker Compose

### Build & Start the Service
```bash
docker compose up --build

### Build & Start the Service
```bash
docker compose up --build
# → Service will be available at http://localhost:8080

### Health Check
curl http://localhost:8080/actuator/health # or /healthz if you use
Go/Node

