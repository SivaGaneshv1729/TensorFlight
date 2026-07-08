"""
weather_model.py
Real weather data integration using Open-Meteo (free, no API key required).

Falls back to a physics-based turbulence model if the network is unavailable.
"""

import asyncio
import time
import math
import logging
from dataclasses import dataclass
from typing import Optional
import urllib.request
import json

logger = logging.getLogger(__name__)

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude={lat}&longitude={lon}"
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code"
    "&wind_speed_unit=ms"
)


@dataclass
class WeatherReport:
    wind_speed_mps: float       # m/s
    wind_dir_deg: float         # 0-360°
    temperature_c: float        # Celsius
    humidity_pct: float         # 0-100
    precipitation_mm: float     # mm/h
    weather_code: int           # WMO weather code
    is_storming: bool
    is_safe_to_fly: bool        # Conservative: wind < 10 m/s, no storm
    source: str                 # 'api' or 'model'
    timestamp: float = 0.0

    def to_dict(self) -> dict:
        return {
            "wind_speed_mps": round(self.wind_speed_mps, 2),
            "wind_dir_deg": round(self.wind_dir_deg, 1),
            "temperature_c": round(self.temperature_c, 1),
            "humidity_pct": round(self.humidity_pct, 1),
            "precipitation_mm": round(self.precipitation_mm, 2),
            "is_storming": self.is_storming,
            "is_safe_to_fly": self.is_safe_to_fly,
            "weather_source": self.source,
        }


class WeatherModel:
    """
    Provides real-time weather data for the drone's GPS location.
    Refreshes from Open-Meteo API every 10 minutes; caches between requests.
    """
    REFRESH_INTERVAL_S = 600   # 10 minutes

    def __init__(self):
        self._cache: Optional[WeatherReport] = None
        self._last_fetch: float = 0.0
        self._current_lat: float = 41.7315   # Default: Iowa (matches simulator home)
        self._current_lon: float = -93.8587

    def update_position(self, lat: float, lon: float):
        """Call this when the active drone GPS position changes significantly."""
        # Only refetch if moved more than ~1km
        if abs(lat - self._current_lat) > 0.01 or abs(lon - self._current_lon) > 0.01:
            self._current_lat = lat
            self._current_lon = lon
            self._last_fetch = 0  # Force refresh on next call

    def get_weather(self) -> WeatherReport:
        """
        Return latest weather. Fetches from API if cache is stale.
        Synchronous — called from background threads/asyncio with run_in_executor.
        """
        now = time.time()
        if self._cache is None or (now - self._last_fetch) > self.REFRESH_INTERVAL_S:
            fresh = self._fetch_from_api(self._current_lat, self._current_lon)
            if fresh:
                self._cache = fresh
                self._last_fetch = now
            else:
                # Use physics fallback
                fallback = self._physics_model(now)
                if self._cache is None:
                    self._cache = fallback

        return self._cache

    def _fetch_from_api(self, lat: float, lon: float) -> Optional[WeatherReport]:
        url = OPEN_METEO_URL.format(lat=lat, lon=lon)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AgriHUD/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())

            current = data.get("current", {})
            wind_speed  = float(current.get("wind_speed_10m", 0))
            wind_dir    = float(current.get("wind_direction_10m", 0))
            temperature = float(current.get("temperature_2m", 20))
            humidity    = float(current.get("relative_humidity_2m", 50))
            precip      = float(current.get("precipitation", 0))
            wmo_code    = int(current.get("weather_code", 0))

            # WMO codes >= 80 indicate rain/thunderstorm
            is_storming = wmo_code >= 80 or wind_speed > 12
            is_safe     = wind_speed < 10.0 and not is_storming and precip < 2.0

            report = WeatherReport(
                wind_speed_mps=wind_speed,
                wind_dir_deg=wind_dir,
                temperature_c=temperature,
                humidity_pct=humidity,
                precipitation_mm=precip,
                weather_code=wmo_code,
                is_storming=is_storming,
                is_safe_to_fly=is_safe,
                source="api",
                timestamp=time.time(),
            )
            logger.info(f"🌤️  Weather fetched: {wind_speed:.1f}m/s @ {wind_dir:.0f}°, code={wmo_code}")
            return report

        except Exception as e:
            logger.warning(f"Weather API unavailable ({e}), using physics model.")
            return None

    def _physics_model(self, t: float) -> WeatherReport:
        """
        Simple quasi-realistic turbulence model for offline use.
        Uses multi-frequency sinusoids to simulate gusting wind patterns.
        """
        # Wind speed: base + slow gust cycle + fast turbulence
        base_wind = 2.5
        gust = 3.0 * abs(math.sin(t * 0.008))
        turb = 0.8 * math.sin(t * 0.07 + 1.3)
        wind_speed = max(0.0, base_wind + gust + turb)

        # Wind direction rotates slowly (Coriolis-like drift)
        wind_dir = (t * 1.5) % 360

        # Temperature: 20°C base with slow diurnal variation
        temp = 22 + 8 * math.sin(t * 0.0001)

        is_storming = wind_speed > 9.0
        is_safe = wind_speed < 10.0 and not is_storming

        return WeatherReport(
            wind_speed_mps=round(wind_speed, 2),
            wind_dir_deg=round(wind_dir, 1),
            temperature_c=round(temp, 1),
            humidity_pct=55.0,
            precipitation_mm=0.0,
            weather_code=0,
            is_storming=is_storming,
            is_safe_to_fly=is_safe,
            source="model",
            timestamp=t,
        )


# Module-level singleton
weather_model = WeatherModel()
