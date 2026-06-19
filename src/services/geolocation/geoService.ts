import type { LatLng } from "@/types";

export interface GeoPosition extends LatLng {
  accuracy: number;
  timestamp: number;
  heading: number | null;
  speed: number | null;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

function normalize(pos: GeolocationPosition): GeoPosition {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
    timestamp: pos.timestamp,
  };
}

export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("เบราว์เซอร์นี้ไม่รองรับ Geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(normalize(p)),
      (err) => reject(err),
      options
    );
  });
}

export function watchPosition(
  onUpdate: (pos: GeoPosition) => void,
  onError?: (err: GeolocationPositionError) => void,
  options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
): () => void {
  if (!isGeolocationSupported()) {
    onError?.({
      code: 2,
      message: "Geolocation unsupported",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return () => undefined;
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onUpdate(normalize(p)),
    (err) => onError?.(err),
    options
  );
  return () => navigator.geolocation.clearWatch(id);
}

export const geoService = {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
};
