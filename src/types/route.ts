export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePoint extends LatLng {
  name?: string;
}

export interface Route {
  id: string;
  name: string;
  province: string;
  from: string;
  to: string;
  /** Average travel speed in km/h, used for ETA */
  avgSpeedKmh: number;
  /** Polyline of the route in order from start to end */
  path: RoutePoint[];
}

export interface RouteSegment {
  /** index along the route (0..path.length-2) */
  index: number;
  start: LatLng;
  end: LatLng;
  /** distance of this segment in meters */
  distanceM: number;
}
