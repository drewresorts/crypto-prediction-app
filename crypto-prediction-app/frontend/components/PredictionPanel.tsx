type Props = {
  data: any;
  error: any;
  isLoading: boolean;
};

function pct(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

export function PredictionPanel({ data, error, isLoading }: Props) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Live Prediction</h2>

      {isLoading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: "crimson" }}>Failed to load.</p> : null}

      {data ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ color: "#666", fontSize: 12 }}>Status</div>
            <div style={{ fontWeight: 600 }}>{data.running ? "Running" : "Stopped"}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 12 }}>Updated</div>
            <div style={{ fontWeight: 600 }}>{data.updated_at ?? "—"}</div>
          </div>

          <div>
            <div style={{ color: "#666", fontSize: 12 }}>Symbol</div>
            <div style={{ fontWeight: 600 }}>{data.symbol ?? "—"}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 12 }}>Interval</div>
            <div style={{ fontWeight: 600 }}>{data.interval ?? "—"}</div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#666", fontSize: 12 }}>Probabilities (down / flat / up)</div>
            {data.latest_prediction ? (
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {pct(data.latest_prediction.prob_down)} / {pct(data.latest_prediction.prob_flat)} /{" "}
                {pct(data.latest_prediction.prob_up)}
              </div>
            ) : (
              <div style={{ color: "#999" }}>No prediction yet (model not loaded or insufficient features).</div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#666", fontSize: 12 }}>Latest features</div>
            <pre style={{ margin: 0, background: "#fafafa", border: "1px solid #eee", padding: 12, borderRadius: 10, overflow: "auto" }}>
              {JSON.stringify(data.latest_features ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}

