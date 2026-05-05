## Crypto Prediction App (v1)

This is a **decision-support** crypto signal app (not auto-trading). It includes:
- **Binance connector** (spot/perp): historical candles + WS streams (trades/orderbook)
- **Offline trainer** that produces a baseline multi-class direction model
- **FastAPI backend** serving `/live` and `/predict`
- **Next.js frontend** dashboard that polls `/live`
- **Backtest script** for quick historical evaluation

### Prereqs
- Python 3.11+
- Node 18+
- Docker (optional, for Postgres)

### Start Postgres (optional)

```bash
cd crypto-prediction-app
docker compose up -d
```

Backend defaults to `postgresql://postgres:postgres@localhost:5432/crypto_pred` via `DATABASE_URL`.

### Backend setup

```bash
cd crypto-prediction-app/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Train a model artifact

```bash
cd crypto-prediction-app/backend
python -m app.models.trainer --symbol BTCUSDT --interval 1m --horizon-minutes 15 --days 7 --market spot
```

This prints `saved_model=...joblib`. Export it for the API:

```bash
export MODEL_ARTIFACT_PATH="/absolute/path/to/the.joblib"
```

### Run the backend

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_pred"
export LIVE_SYMBOL="BTCUSDT"
export LIVE_INTERVAL="1m"
export LIVE_MARKET="spot"
export LIVE_HORIZON_MINUTES="15"

uvicorn app.main:app --reload --port 8000
```

Endpoints:
- `GET /health`
- `GET /model`
- `GET /live`
- `POST /predict`

### Backtest

```bash
python -m app.models.backtest --symbol BTCUSDT --interval 1m --days 7 --market spot --horizon-minutes 15 --artifact "$MODEL_ARTIFACT_PATH"
```

### Frontend setup

```bash
cd crypto-prediction-app/frontend
npm install
export NEXT_PUBLIC_API_BASE="http://localhost:8000"
npm run dev
```

Open `http://localhost:3000`.

### Notes / next improvements
- Replace REST polling in real-time loop with aggregated candle building from WS trades and compute orderbook imbalance from WS depth.
- Add per-user symbol lists persisted in DB and update backend live subscriptions dynamically.
- Add proper model registry/versioning and a metrics UI.

## Deploy to DigitalOcean App Platform (managed Postgres)

This repo includes a `do-app.yaml` spec that deploys:
- a **frontend** service (Next.js)
- a **backend** service (FastAPI)
- a **managed Postgres** database

### Steps (UI)
1. Push `crypto-prediction-app/` to GitHub.
2. In DigitalOcean, create a new **App** from that repo.
3. When asked for an App spec, point it at `do-app.yaml` (or paste its contents).
4. Set/verify environment variables:
   - Backend:
     - `DATABASE_URL` (wired to managed DB by the spec)
     - `LIVE_SYMBOL`, `LIVE_INTERVAL`, `LIVE_MARKET`, `LIVE_HORIZON_MINUTES`
     - `MODEL_ARTIFACT_PATH` can be blank; the backend will train a baseline model on startup if none is provided.
   - Frontend:
     - `NEXT_PUBLIC_API_BASE` should be `https://<your-app-domain>/api`
5. Deploy.

### Smoke test
- Frontend should load and show `Running`.
- Backend endpoints (via the routed prefix):
  - `GET https://<your-app-domain>/api/health`
  - `GET https://<your-app-domain>/api/live`


