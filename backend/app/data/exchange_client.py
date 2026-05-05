import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, AsyncIterator, Literal, Optional

import httpx
import websockets

MarketType = Literal["spot", "perp"]


@dataclass(frozen=True)
class Kline:
    symbol: str
    interval: str
    open_time: datetime
    close_time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    quote_volume: Optional[float] = None
    number_of_trades: Optional[int] = None


class BinanceClient:
    def __init__(self, market: MarketType = "spot", timeout_s: float = 10.0) -> None:
        self.market = market
        self._timeout = timeout_s

        if market == "spot":
            self._rest_base = "https://api.binance.com"
            self._ws_base = "wss://stream.binance.com:9443"
            self._kline_path = "/api/v3/klines"
        else:
            self._rest_base = "https://fapi.binance.com"
            self._ws_base = "wss://fstream.binance.com"
            self._kline_path = "/fapi/v1/klines"

        self._http = httpx.AsyncClient(timeout=httpx.Timeout(self._timeout))

    async def aclose(self) -> None:
        await self._http.aclose()

    async def fetch_klines(
        self,
        symbol: str,
        interval: str,
        *,
        start_time_ms: Optional[int] = None,
        end_time_ms: Optional[int] = None,
        limit: int = 1000,
    ) -> list[Kline]:
        params: dict[str, Any] = {"symbol": symbol.upper(), "interval": interval, "limit": int(limit)}
        if start_time_ms is not None:
            params["startTime"] = int(start_time_ms)
        if end_time_ms is not None:
            params["endTime"] = int(end_time_ms)

        resp = await self._http.get(f"{self._rest_base}{self._kline_path}", params=params)
        resp.raise_for_status()
        data = resp.json()

        out: list[Kline] = []
        for row in data:
            open_time = datetime.fromtimestamp(row[0] / 1000, tz=timezone.utc)
            close_time = datetime.fromtimestamp(row[6] / 1000, tz=timezone.utc)
            out.append(
                Kline(
                    symbol=symbol.upper(),
                    interval=interval,
                    open_time=open_time,
                    close_time=close_time,
                    open=float(row[1]),
                    high=float(row[2]),
                    low=float(row[3]),
                    close=float(row[4]),
                    volume=float(row[5]),
                    quote_volume=float(row[7]) if row[7] is not None else None,
                    number_of_trades=int(row[8]) if row[8] is not None else None,
                )
            )
        return out

    async def stream_agg_trades(self, symbol: str) -> AsyncIterator[dict[str, Any]]:
        stream = f"{symbol.lower()}@aggTrade"
        url = f"{self._ws_base}/ws/{stream}"
        async for msg in self._stream_json(url):
            yield msg

    async def stream_partial_depth(
        self, symbol: str, *, levels: int = 20, update_ms: int = 1000
    ) -> AsyncIterator[dict[str, Any]]:
        stream = f"{symbol.lower()}@depth{levels}@{update_ms}ms"
        url = f"{self._ws_base}/ws/{stream}"
        async for msg in self._stream_json(url):
            yield msg

    async def _stream_json(self, url: str) -> AsyncIterator[dict[str, Any]]:
        backoff_s = 0.5
        while True:
            try:
                async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                    backoff_s = 0.5
                    while True:
                        raw = await ws.recv()
                        yield json.loads(raw)
            except asyncio.CancelledError:
                raise
            except Exception:
                await asyncio.sleep(backoff_s)
                backoff_s = min(30.0, backoff_s * 1.8)

