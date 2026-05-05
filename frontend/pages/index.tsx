import { useMemo, useState } from "react";
import useSWR from "swr";

import { AssetSelector } from "../components/AssetSelector";
import { PredictionPanel } from "../components/PredictionPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1m");
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000",
    [],
  );

  const { data, error, isLoading } = useSWR(
    `${apiBase}/live`,
    fetcher,
    { refreshInterval: 2000 },
  );

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Crypto Prediction Dashboard</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Live, decision-support signals (v1 baseline model).
      </p>

      <AssetSelector
        symbol={symbol}
        interval={interval}
        onChangeSymbol={setSymbol}
        onChangeInterval={setInterval}
        note={`For v1, the backend live loop uses env vars (LIVE_SYMBOL/LIVE_INTERVAL).`}
      />

      <div style={{ marginTop: 16 }}>
        <PredictionPanel data={data} error={error} isLoading={isLoading} />
      </div>
    </main>
  );
}

