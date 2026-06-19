"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng, RainAnalysis, RainEvent, Route } from "@/types";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

interface MapClientProps {
  route: Route | null;
  position: (LatLng & { heading?: number | null }) | null;
  analysis: RainAnalysis | null;
  className?: string;
  /** Polyline to draw for the in-progress route (road-following preferred). */
  draftPath?: LatLng[];
  /** User-clicked waypoints (rendered as numbered markers). */
  draftWaypoints?: LatLng[];
  /** Fired when the user clicks the map in draw mode. */
  onMapClick?: (p: LatLng) => void;
}

function makeDot(color: string, label?: string): L.DivIcon {
  return L.divIcon({
    className: "rainroute-dot",
    html: `<div style="background:${color}" class="rr-dot">${label ?? ""}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function makePulse(color: string): L.DivIcon {
  return L.divIcon({
    className: "rainroute-pulse",
    html: `<div class="rr-pulse" style="--c:${color}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Stable module-level icons — must NOT be recreated per render or Leaflet will
// try to read _leaflet_pos on a DOM node that hasn't been positioned yet.
const ICONS = {
  start: makeDot("#0ea5e9", "S"),
  end: makeDot("#1e3a8a", "E"),
  me: makePulse("#0ea5e9"),
  rain: {
    none: makeDot("#22c55e"),
    light: makeDot("#eab308"),
    heavy: makeDot("#ef4444"),
  } as Record<RainEvent["level"], L.DivIcon>,
};

// Up to 99 numbered draft icons created lazily — same idea: never inline.
const draftIconCache = new Map<number, L.DivIcon>();
function getDraftIcon(n: number): L.DivIcon {
  const cached = draftIconCache.get(n);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "rainroute-draft",
    html: `<div class="rr-dot" style="background:#9333ea;border-color:#fff;font-size:11px">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
  draftIconCache.set(n, icon);
  return icon;
}

function ClickCapture({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function FitToRoute({ path }: { path: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length === 0) return;
    try {
      const bounds = L.latLngBounds(path.map((p) => [p.lat, p.lng]));
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch {
      // map not fully attached yet — next prop change will retry
    }
  }, [map, path]);
  return null;
}

export default function MapClient({
  route,
  position,
  analysis,
  className,
  draftPath,
  draftWaypoints,
  onMapClick,
}: MapClientProps) {
  const center = useMemo<LatLng>(() => {
    if (position) return position;
    if (route && route.path.length > 0) {
      const mid = route.path[Math.floor(route.path.length / 2)];
      return mid;
    }
    return { lat: 9.5, lng: 100.0 };
  }, [route, position]);

  // Guard against HMR / double mount: capture the L.Map instance and call
  // remove() on unmount so the container's _leaflet_id is cleared before
  // react-leaflet tries to attach again.
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (map) {
        map.off();
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <MapContainer
      ref={(instance) => {
        mapRef.current = instance ?? null;
      }}
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      className={cn("h-full w-full", onMapClick && "rr-drawing", className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route && route.path.length > 1 && (
        <>
          <Polyline
            positions={route.path.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.85 }}
          />
          <FitToRoute path={route.path} />
          <Marker
            position={[route.path[0].lat, route.path[0].lng]}
            icon={ICONS.start}
          >
            <Popup>เริ่มต้น: {route.from}</Popup>
          </Marker>
          <Marker
            position={[
              route.path[route.path.length - 1].lat,
              route.path[route.path.length - 1].lng,
            ]}
            icon={ICONS.end}
          >
            <Popup>ปลายทาง: {route.to}</Popup>
          </Marker>
        </>
      )}

      {analysis?.events.map((e) => (
        <Marker
          key={`${e.pointIndex}-${e.expectedAt}`}
          position={[e.location.lat, e.location.lng]}
          icon={ICONS.rain[e.level]}
        >
          <Popup>
            <div className="space-y-1 text-xs">
              <div className="font-semibold">
                {e.level === "heavy" ? "ฝนหนัก" : "ฝนเบา"}
              </div>
              <div>โอกาสฝน: {Math.round(e.probability)}%</div>
              <div>ความหนัก: {e.intensity.toFixed(2)} mm/h</div>
              <div>คาดถึงในอีก {e.minutesUntil} นาที</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {position && (
        <Marker position={[position.lat, position.lng]} icon={ICONS.me}>
          <Popup>ตำแหน่งคุณ</Popup>
        </Marker>
      )}

      {draftPath && draftPath.length > 1 && (
        <Polyline
          positions={draftPath.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#9333ea",
            weight: 5,
            opacity: 0.85,
          }}
        />
      )}

      {draftWaypoints?.map((p, i) => (
        <Marker
          key={`waypoint-${i}`}
          position={[p.lat, p.lng]}
          icon={getDraftIcon(i + 1)}
        />
      ))}

      {onMapClick && <ClickCapture onClick={onMapClick} />}
    </MapContainer>
  );
}
