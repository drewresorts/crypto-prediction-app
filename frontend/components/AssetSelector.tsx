type Props = {
  symbol: string;
  interval: string;
  onChangeSymbol: (s: string) => void;
  onChangeInterval: (s: string) => void;
  note?: string;
};

export function AssetSelector({
  symbol,
  interval,
  onChangeSymbol,
  onChangeInterval,
  note,
}: Props) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        background: "#fafafa",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>
        Watchlist Settings
      </h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#555" }}>Symbol</span>
          <input
            value={symbol}
            onChange={(e) => onChangeSymbol(e.target.value.toUpperCase())}
            placeholder="BTCUSDT"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              minWidth: 180,
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#555" }}>Interval</span>
          <select
            value={interval}
            onChange={(e) => onChangeInterval(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              minWidth: 140,
              background: "white",
            }}
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
          </select>
        </label>
      </div>
      {note ? (
        <p style={{ marginBottom: 0, marginTop: 12, color: "#666", fontSize: 12 }}>
          {note}
        </p>
      ) : null}
    </section>
  );
}

