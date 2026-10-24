"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Car, Check, Loader2, MapPin, Navigation, Route, ShieldCheck } from "lucide-react";

import type { TransportationPricingConfig } from "@/server/db/types";

export interface VehicleTier {
  id: string;
  name: string;
  shortName: string;
  capacity: string;
  passengers: string;
  luggage: string;
  models: string;
  description?: string;
  features?: string[];
}

export const VEHICLE_TIERS: VehicleTier[] = [
  {
    id: "executive_sedan",
    name: "Executive Sedan",
    shortName: "Executive Sedan",
    capacity: "1–3 Passengers",
    passengers: "Up to 3 passengers",
    luggage: "3 bags",
    models: "Mercedes-Benz S-Class, BMW 7 Series",
    description: "Mercedes-Benz S-Class, BMW 7 Series"
  },
  {
    id: "luxury_suv",
    name: "Luxury SUV",
    shortName: "Luxury SUV",
    capacity: "1–6 Passengers",
    passengers: "Up to 6 passengers",
    luggage: "6 bags",
    models: "Cadillac Escalade, Lincoln Navigator",
    description: "Cadillac Escalade, Lincoln Navigator"
  },
  {
    id: "vip_sprinter",
    name: "VIP Executive Sprinter",
    shortName: "VIP Sprinter",
    capacity: "1–12 Passengers",
    passengers: "Up to 12 passengers",
    luggage: "12 bags",
    models: "Mercedes-Benz Sprinter Executive",
    description: "Mercedes-Benz Sprinter Executive"
  }
];

interface LocationSuggestion {
  displayName: string;
  lat: number;
  lon: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface RoutesApiResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
}

interface OsrmResponse {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => void;
  fitBounds: (bounds: unknown, options?: unknown) => void;
  removeLayer: (layer: unknown) => void;
  invalidateSize: () => void;
  remove: () => void;
}

interface LeafletMarker {
  addTo: (map: unknown) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
}

interface LeafletLayer {
  addTo: (map: unknown) => LeafletLayer;
}

interface LeafletNamespace {
  map: (el: HTMLElement, options?: unknown) => LeafletMap;
  tileLayer: (url: string, options?: unknown) => LeafletLayer;
  marker: (latlng: [number, number], options?: unknown) => LeafletMarker;
  divIcon: (options: unknown) => unknown;
  geoJSON: (geojson: unknown, options?: unknown) => LeafletLayer;
  polyline: (latlngs: [number, number][], options?: unknown) => LeafletLayer;
  latLngBounds: (latlngs: [number, number][]) => unknown;
}

type WindowWithMaps = Window & {
  L?: LeafletNamespace;
  google?: typeof google;
  gm_authFailure?: () => void;
};

export const DEFAULT_VEHICLE_PRICING: TransportationPricingConfig = {
  unit: "mile",
  longDistanceThreshold: 10, // 10 miles
  tiers: {
    executive_sedan: {
      basePriceCents: 2000,
      pricePerKmCents: 450,
      reducedPricePerKmCents: 155,
      longDistanceDiscountPercent: 66
    },
    luxury_suv: {
      basePriceCents: 3000,
      pricePerKmCents: 480,
      reducedPricePerKmCents: 185,
      longDistanceDiscountPercent: 61
    },
    vip_sprinter: {
      basePriceCents: 5000,
      pricePerKmCents: 600,
      reducedPricePerKmCents: 250,
      longDistanceDiscountPercent: 58
    }
  }
};

export function calculateVehicleFare(
  tierId: string,
  distanceKm: number,
  config?: TransportationPricingConfig
): {
  totalCents: number;
  formatted: string;
  formula: string;
  baseFormatted: string;
  perKmFormatted: string;
  standardDistance: number;
  discountedDistance: number;
  savingsDollars: number;
} {
  const activeConfig = config || DEFAULT_VEHICLE_PRICING;
  const tiers = activeConfig.tiers || DEFAULT_VEHICLE_PRICING.tiers;
  const key = tierId as keyof typeof tiers;
  const tier = tiers[key] || DEFAULT_VEHICLE_PRICING.tiers.executive_sedan;

  const isMile = activeConfig.unit === "mile";
  const unitLabel = isMile ? "mi" : "km";
  const distanceInUnit = isMile ? distanceKm / 1.609344 : distanceKm;

  // Threshold: default 10 miles if unit is miles, or 16 km (~10 miles) if unit is km
  const defaultThreshold = isMile ? 10 : 16;
  const threshold =
    typeof activeConfig.longDistanceThreshold === "number" && activeConfig.longDistanceThreshold > 0
      ? activeConfig.longDistanceThreshold
      : defaultThreshold;

  const baseDollars = tier.basePriceCents / 100;
  const standardRateDollars = tier.pricePerKmCents / 100;

  // Determine reduced rate for distance beyond threshold
  let reducedRateDollars = standardRateDollars;
  if (typeof tier.reducedPricePerKmCents === "number" && tier.reducedPricePerKmCents > 0) {
    reducedRateDollars = tier.reducedPricePerKmCents / 100;
  } else if (
    typeof tier.longDistanceDiscountPercent === "number" &&
    tier.longDistanceDiscountPercent > 0
  ) {
    reducedRateDollars = standardRateDollars * (1 - tier.longDistanceDiscountPercent / 100);
  } else {
    // Default 30% discount on miles/km beyond threshold
    reducedRateDollars = standardRateDollars * 0.7;
  }

  let totalDollars = baseDollars;
  let standardDist = distanceInUnit;
  let discountedDist = 0;

  if (distanceInUnit <= threshold) {
    totalDollars += distanceInUnit * standardRateDollars;
  } else {
    standardDist = threshold;
    discountedDist = distanceInUnit - threshold;
    totalDollars += standardDist * standardRateDollars + discountedDist * reducedRateDollars;
  }

  const unadjustedTotal = baseDollars + distanceInUnit * standardRateDollars;
  const savingsDollars = Math.max(0, unadjustedTotal - totalDollars);
  const totalCents = Math.round(totalDollars * 100);

  const formula =
    distanceInUnit <= threshold
      ? `$${baseDollars.toFixed(0)} base + (${distanceInUnit.toFixed(1)} ${unitLabel} × $${standardRateDollars.toFixed(2)}/${unitLabel})`
      : `$${baseDollars.toFixed(0)} base + (${standardDist.toFixed(1)} ${unitLabel} × $${standardRateDollars.toFixed(2)}) + (${discountedDist.toFixed(1)} ${unitLabel} × $${reducedRateDollars.toFixed(2)} [discounted])`;

  return {
    totalCents,
    formatted: `$${totalDollars.toFixed(2)}`,
    formula,
    baseFormatted: `$${baseDollars.toFixed(0)}`,
    perKmFormatted: `$${standardRateDollars.toFixed(2)}/${unitLabel}`,
    standardDistance: standardDist,
    discountedDistance: discountedDist,
    savingsDollars
  };
}

export interface TransportationBookingProps {
  pickupLocation: string;
  onPickupChange: (val: string) => void;
  dropoffLocation: string;
  onDropoffChange: (val: string) => void;
  vehicleClass: string;
  onVehicleChange: (val: string) => void;
  passengers: number;
  onPassengersChange: (val: number) => void;
  pricing?: TransportationPricingConfig;
  onEstimatedFareChange?: (cents: number) => void;
}

function isRealGoogleKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 25 && !trimmed.startsWith("YOUR_");
}

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  if (!encoded) return [];
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// Dynamically load Leaflet assets if Google Maps is unavailable
function loadLeafletAssets(): Promise<LeafletNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const win = window as WindowWithMaps;
  if (win.L) return Promise.resolve(win.L);

  return new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (win.L) {
      resolve(win.L);
      return;
    }

    const existingScript = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (win.L) resolve(win.L);
        else reject(new Error("Leaflet failed to load"));
      });
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (win.L) resolve(win.L);
      else reject(new Error("Leaflet missing after script load"));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function TransportationBooking({
  pickupLocation,
  onPickupChange,
  dropoffLocation,
  onDropoffChange,
  vehicleClass,
  onVehicleChange,
  passengers,
  onPassengersChange,
  pricing,
  onEstimatedFareChange
}: TransportationBookingProps) {
  const selectedVehicle = VEHICLE_TIERS.find((v) => v.id === vehicleClass) || VEHICLE_TIERS[0]!;

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const googleApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC_h3zXiX_cpDlRBoxPQY7FNUsyUAXHFRM";
  const [useGoogle, setUseGoogle] = useState(() => isRealGoogleKey(googleApiKey));
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    distanceKm: number;
    duration: string;
  } | null>(null);

  const activePricing = pricing || DEFAULT_VEHICLE_PRICING;

  // Suggestions state for OpenStreetMap Nominatim
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [dropoffSearching, setDropoffSearching] = useState(false);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);

  // Coordinates and road route geometry
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);

  // Leaflet refs
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletPickupMarkerRef = useRef<LeafletMarker | null>(null);
  const leafletDropoffMarkerRef = useRef<LeafletMarker | null>(null);
  const leafletRouteLayerRef = useRef<LeafletLayer | null>(null);

  // Google Maps refs
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googlePickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleDropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const googlePolylineRef = useRef<google.maps.Polyline | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Google Maps Error Interception (Graceful fallback)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as WindowWithMaps;

    const triggerFallback = (reason: string) => {
      console.warn(
        `[KLX Map] Google Maps unavailable (${reason}); falling back seamlessly to OpenStreetMap engine.`
      );
      const gmModals = document.querySelectorAll(
        ".gm-err-container, .gm-style-moc, .gm-err-content, .gm-err-autocomplete"
      );
      gmModals.forEach((el) => el.remove());
      if (googlePickupMarkerRef.current) {
        googlePickupMarkerRef.current.setMap(null);
        googlePickupMarkerRef.current = null;
      }
      if (googleDropoffMarkerRef.current) {
        googleDropoffMarkerRef.current.setMap(null);
        googleDropoffMarkerRef.current = null;
      }
      if (googlePolylineRef.current) {
        googlePolylineRef.current.setMap(null);
        googlePolylineRef.current = null;
      }
      googleMapRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
      setUseGoogle(false);
      setMapLoaded(false);
    };

    win.gm_authFailure = () => triggerFallback("gm_authFailure");

    // Intercept console.error for LegacyApiNotActivatedMapError / ApiNotActivatedMapError
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = args
        .map((a) => {
          if (typeof a === "string") return a;
          if (a instanceof Error) return a.message;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");

      if (
        msg.includes("LegacyApiNotActivatedMapError") ||
        msg.includes("ApiNotActivatedMapError") ||
        msg.includes("Google Maps JavaScript API error") ||
        msg.includes("MissingKeyMapError") ||
        msg.includes("BillingNotEnabledMapError")
      ) {
        triggerFallback("API restriction error detected in console");
      }
      originalConsoleError.apply(console, args);
    };

    // DOM MutationObserver to detect and instantly suppress any injected Google error banners
    const observer = new MutationObserver(() => {
      const errNodes = document.querySelectorAll(
        ".gm-err-container, .gm-err-content, .gm-err-autocomplete"
      );
      if (errNodes.length > 0) {
        const errorText = Array.from(errNodes)
          .map((n) => n.textContent)
          .join(" ");
        console.warn("[KLX Map] Google Maps error banner detected:", errorText);
        triggerFallback(`DOM error banner: ${errorText}`);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      console.error = originalConsoleError;
      observer.disconnect();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Load Google Maps if valid key provided
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!useGoogle || typeof window === "undefined") return;

    const win = window as WindowWithMaps;
    if (win.google?.maps?.Map) {
      queueMicrotask(() => setMapLoaded(true));
      return;
    }

    const scriptId = "google-maps-script";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", () => setMapLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      setUseGoogle(false);
      setMapLoaded(false);
    };
    document.head.appendChild(script);
  }, [useGoogle, googleApiKey]);

  // ---------------------------------------------------------------------------
  // 3. Initialize Google Maps Engine
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!useGoogle || !mapLoaded || typeof window === "undefined" || !mapContainerRef.current)
      return;
    const win = window as WindowWithMaps;
    if (!win.google?.maps) return;

    try {
      if (!googleMapRef.current) {
        const map = new win.google.maps.Map(mapContainerRef.current, {
          center: { lat: 40.7128, lng: -74.006 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
          ]
        });

        googleMapRef.current = map;
      }
    } catch (err) {
      console.warn("Failed initializing Google Maps, falling back to OpenStreetMap:", err);
      if (googlePickupMarkerRef.current) {
        googlePickupMarkerRef.current.setMap(null);
        googlePickupMarkerRef.current = null;
      }
      if (googleDropoffMarkerRef.current) {
        googleDropoffMarkerRef.current.setMap(null);
        googleDropoffMarkerRef.current = null;
      }
      if (googlePolylineRef.current) {
        googlePolylineRef.current.setMap(null);
        googlePolylineRef.current = null;
      }
      googleMapRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
      queueMicrotask(() => {
        setUseGoogle(false);
        setMapLoaded(false);
      });
    }
  }, [useGoogle, mapLoaded]);

  // ---------------------------------------------------------------------------
  // 4. Initialize Leaflet / OpenStreetMap Engine (Default & Fallback)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (useGoogle) return;

    let isMounted = true;
    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!leafletMapRef.current && mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
          const map = L.map(mapContainerRef.current, {
            center: [40.7128, -74.006],
            zoom: 11,
            zoomControl: true
          });

          // Standard OpenStreetMap tiles (100% free, no API key required, zero watermarks)
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(map);

          leafletMapRef.current = map;
          setMapLoaded(true);

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }
      })
      .catch((err) => {
        console.error("Leaflet asset load error:", err);
      });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [useGoogle]);

  // ---------------------------------------------------------------------------
  // 5. Autocomplete Suggestions (Server Places API with Nominatim Fallback)
  // ---------------------------------------------------------------------------
  const searchLocations = useCallback(
    async (
      query: string,
      setResults: (items: LocationSuggestion[]) => void,
      setLoading: (l: boolean) => void
    ) => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      // 1. Try server Places proxy route (Google Places + server Nominatim fallback)
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: LocationSuggestion[] };
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setResults(data.suggestions);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through to client Nominatim
      }

      // 2. Direct client fallback to OpenStreetMap Nominatim
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim()
        )}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            Accept: "application/json"
          }
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as NominatimResult[];
        if (Array.isArray(data)) {
          const suggestions: LocationSuggestion[] = data.map((item) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
          setResults(suggestions);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced input search for Pickup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickupFocused) {
        searchLocations(pickupLocation, setPickupSuggestions, setPickupSearching);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pickupLocation, pickupFocused, searchLocations]);

  // Debounced input search for Drop-off
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dropoffFocused) {
        searchLocations(dropoffLocation, setDropoffSuggestions, setDropoffSearching);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [dropoffLocation, dropoffFocused, searchLocations]);

  // Geocode address to lat/lng using Server Places API (with client Nominatim fallback)
  const handleManualGeocode = async (address: string, isPickup: boolean) => {
    if (!address.trim()) return;

    // 1. Try server Places geocoding proxy
    try {
      const res = await fetch(`/api/places?address=${encodeURIComponent(address.trim())}`);
      if (res.ok) {
        const data = (await res.json()) as { lat?: number; lon?: number };
        if (data.lat && data.lon) {
          if (isPickup) {
            setPickupCoords([data.lat, data.lon]);
          } else {
            setDropoffCoords([data.lat, data.lon]);
          }
          return;
        }
      }
    } catch {
      // Fall through to client Nominatim
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address.trim()
      )}&limit=1`;
      const res = await fetch(url);
      const data = (await res.json()) as NominatimResult[];
      if (Array.isArray(data) && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (isPickup) {
          setPickupCoords([lat, lon]);
        } else {
          setDropoffCoords([lat, lon]);
        }
      }
    } catch {
      // Ignore network errors
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Calculate Route & Driving Road Geometry (Google Routes API / OSRM)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      queueMicrotask(() => {
        setRouteInfo(null);
        setRoutePoints([]);
      });
      return;
    }

    const [pLat, pLon] = pickupCoords;
    const [dLat, dLon] = dropoffCoords;
    let active = true;

    if (googleApiKey && isRealGoogleKey(googleApiKey)) {
      fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: pLat, longitude: pLon } } },
          destination: { location: { latLng: { latitude: dLat, longitude: dLon } } },
          travelMode: "DRIVE"
        })
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Routes API fail"))))
        .then((data: RoutesApiResponse) => {
          if (!active) return;
          if (data.routes && data.routes[0]) {
            const meters = data.routes[0].distanceMeters || 0;
            const durRaw = data.routes[0].duration || "0s";
            const durSeconds = parseInt(durRaw.replace("s", ""), 10) || 0;
            const distKm = parseFloat((meters / 1000).toFixed(1));
            const distMiles = (meters / 1609.34).toFixed(1);
            const durMins = Math.round(durSeconds / 60);
            setRouteInfo({
              distance: `${distKm} km (${distMiles} mi)`,
              distanceKm: distKm,
              duration: `${durMins} mins`
            });
            if (data.routes[0].polyline?.encodedPolyline) {
              const decoded = decodePolyline(data.routes[0].polyline.encodedPolyline);
              setRoutePoints(decoded);
            }
          }
        })
        .catch(() => {
          if (!active) return;
          // Fallback to OSRM driving route
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=full&geometries=geojson`;
          fetch(osrmUrl)
            .then((r) => r.json())
            .then((d: OsrmResponse) => {
              if (!active) return;
              if (d.routes && d.routes[0]) {
                const distKm = parseFloat((d.routes[0].distance / 1000).toFixed(1));
                const distMiles = (d.routes[0].distance / 1609.34).toFixed(1);
                const durMins = Math.round(d.routes[0].duration / 60);
                setRouteInfo({
                  distance: `${distKm} km (${distMiles} mi)`,
                  distanceKm: distKm,
                  duration: `${durMins} mins`
                });
                if (Array.isArray(d.routes[0].geometry?.coordinates)) {
                  const points = d.routes[0].geometry.coordinates.map(([lon, lat]) => ({
                    lat,
                    lng: lon
                  }));
                  setRoutePoints(points);
                }
              }
            })
            .catch(() => {});
        });
    } else {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=full&geometries=geojson`;
      fetch(osrmUrl)
        .then((r) => r.json())
        .then((d: OsrmResponse) => {
          if (!active) return;
          if (d.routes && d.routes[0]) {
            const distKm = parseFloat((d.routes[0].distance / 1000).toFixed(1));
            const distMiles = (d.routes[0].distance / 1609.34).toFixed(1);
            const durMins = Math.round(d.routes[0].duration / 60);
            setRouteInfo({
              distance: `${distKm} km (${distMiles} mi)`,
              distanceKm: distKm,
              duration: `${durMins} mins`
            });
            if (Array.isArray(d.routes[0].geometry?.coordinates)) {
              const points = d.routes[0].geometry.coordinates.map(([lon, lat]) => ({
                lat,
                lng: lon
              }));
              setRoutePoints(points);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [pickupCoords, dropoffCoords, googleApiKey]);

  // ---------------------------------------------------------------------------
  // 7. Render Markers & Driving Road Polyline on Map
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapLoaded) return;
    const win = window as WindowWithMaps;

    // A. Update Google Map
    if (useGoogle && googleMapRef.current && win.google?.maps) {
      const map = googleMapRef.current;

      // Pickup Marker
      if (pickupCoords) {
        if (!googlePickupMarkerRef.current) {
          googlePickupMarkerRef.current = new win.google.maps.Marker({
            position: { lat: pickupCoords[0], lng: pickupCoords[1] },
            map,
            title: "Pickup",
            icon: {
              path: win.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#059669",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
        } else {
          googlePickupMarkerRef.current.setPosition({ lat: pickupCoords[0], lng: pickupCoords[1] });
        }
      } else if (googlePickupMarkerRef.current) {
        googlePickupMarkerRef.current.setMap(null);
        googlePickupMarkerRef.current = null;
      }

      // Dropoff Marker
      if (dropoffCoords) {
        if (!googleDropoffMarkerRef.current) {
          googleDropoffMarkerRef.current = new win.google.maps.Marker({
            position: { lat: dropoffCoords[0], lng: dropoffCoords[1] },
            map,
            title: "Destination",
            icon: {
              path: win.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#0284c7",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
        } else {
          googleDropoffMarkerRef.current.setPosition({
            lat: dropoffCoords[0],
            lng: dropoffCoords[1]
          });
        }
      } else if (googleDropoffMarkerRef.current) {
        googleDropoffMarkerRef.current.setMap(null);
        googleDropoffMarkerRef.current = null;
      }

      // Road Route Polyline & Bounds
      if (routePoints.length > 0) {
        if (googlePolylineRef.current) {
          googlePolylineRef.current.setMap(null);
        }
        googlePolylineRef.current = new win.google.maps.Polyline({
          path: routePoints,
          geodesic: true,
          strokeColor: "#0284c7",
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map
        });

        const bounds = new win.google.maps.LatLngBounds();
        routePoints.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, 45);
      } else {
        if (googlePolylineRef.current) {
          googlePolylineRef.current.setMap(null);
          googlePolylineRef.current = null;
        }
        if (pickupCoords && !dropoffCoords) {
          map.setCenter({ lat: pickupCoords[0], lng: pickupCoords[1] });
          map.setZoom(13);
        } else if (!pickupCoords && dropoffCoords) {
          map.setCenter({ lat: dropoffCoords[0], lng: dropoffCoords[1] });
          map.setZoom(13);
        }
      }
    }

    // B. Update Leaflet Map
    if (!useGoogle && leafletMapRef.current) {
      const L = win.L;
      const map = leafletMapRef.current;
      if (L && map) {
        // Pickup Marker
        if (pickupCoords) {
          if (!leafletPickupMarkerRef.current) {
            const icon = L.divIcon({
              className: "klx-map-marker",
              html: `<div style="display:inline-flex;align-items:center;gap:4px;background:#059669;color:#ffffff;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(5,150,105,0.4);border:2px solid #ffffff;white-space:nowrap;transform:translate(-50%,-100%);">
                <span>📍</span> Pickup
              </div>`,
              iconSize: [0, 0]
            });
            leafletPickupMarkerRef.current = L.marker(pickupCoords, { icon }).addTo(map);
          } else {
            leafletPickupMarkerRef.current.setLatLng(pickupCoords);
          }
        } else if (leafletPickupMarkerRef.current) {
          map.removeLayer(leafletPickupMarkerRef.current);
          leafletPickupMarkerRef.current = null;
        }

        // Dropoff Marker
        if (dropoffCoords) {
          if (!leafletDropoffMarkerRef.current) {
            const icon = L.divIcon({
              className: "klx-map-marker",
              html: `<div style="display:inline-flex;align-items:center;gap:4px;background:#0284c7;color:#ffffff;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(2,132,199,0.4);border:2px solid #ffffff;white-space:nowrap;transform:translate(-50%,-100%);">
                <span>🎯</span> Destination
              </div>`,
              iconSize: [0, 0]
            });
            leafletDropoffMarkerRef.current = L.marker(dropoffCoords, { icon }).addTo(map);
          } else {
            leafletDropoffMarkerRef.current.setLatLng(dropoffCoords);
          }
        } else if (leafletDropoffMarkerRef.current) {
          map.removeLayer(leafletDropoffMarkerRef.current);
          leafletDropoffMarkerRef.current = null;
        }

        // Road Route Polyline & Bounds
        if (routePoints.length > 0) {
          if (leafletRouteLayerRef.current) {
            map.removeLayer(leafletRouteLayerRef.current);
          }
          const latLngs = routePoints.map((p) => [p.lat, p.lng] as [number, number]);
          leafletRouteLayerRef.current = L.polyline(latLngs, {
            color: "#0284c7",
            weight: 5,
            opacity: 0.85
          }).addTo(map);

          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [40, 40] });
        } else {
          if (leafletRouteLayerRef.current) {
            map.removeLayer(leafletRouteLayerRef.current);
            leafletRouteLayerRef.current = null;
          }
          if (pickupCoords && !dropoffCoords) {
            map.setView(pickupCoords, 13);
          } else if (!pickupCoords && dropoffCoords) {
            map.setView(dropoffCoords, 13);
          }
        }
      }
    }
  }, [useGoogle, mapLoaded, pickupCoords, dropoffCoords, routePoints]);

  const effectiveRouteInfo = pickupLocation && dropoffLocation ? routeInfo : null;

  // Sync estimated fare to parent whenever vehicle or route distance changes
  useEffect(() => {
    if (effectiveRouteInfo?.distanceKm) {
      const { totalCents } = calculateVehicleFare(
        vehicleClass,
        effectiveRouteInfo.distanceKm,
        activePricing
      );
      onEstimatedFareChange?.(totalCents);
    } else {
      onEstimatedFareChange?.(0);
    }
  }, [effectiveRouteInfo, vehicleClass, activePricing, onEstimatedFareChange]);

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-slate-900">
          <Car className="size-5 text-sky-700" />
          <h4 className="text-sm font-semibold tracking-tight">Luxury Transportation Details</h4>
        </div>
        <span className="hidden rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 sm:inline-block">
          Chauffeur Service
        </span>
      </div>

      {/* Location Inputs with Autocomplete Dropdowns */}
      <div className="relative z-30 grid gap-3 sm:grid-cols-2">
        {/* Pickup Input */}
        <div className={`relative ${pickupFocused ? "z-50" : "z-20"}`}>
          <label className="text-xs font-medium text-slate-700">
            Pickup Location *
            <div className="relative mt-1">
              <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-600" />
              <input
                ref={pickupInputRef}
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => {
                  onPickupChange(e.target.value);
                  if (!e.target.value) setPickupCoords(null);
                }}
                onFocus={() => setPickupFocused(true)}
                onBlur={() => {
                  setTimeout(() => setPickupFocused(false), 200);
                  if (pickupLocation && !pickupCoords) {
                    void handleManualGeocode(pickupLocation, true);
                  }
                }}
                placeholder="Start typing hotel, airport, or address…"
                className="klx-input pr-8 pl-9 text-xs"
              />
              {pickupSearching && (
                <Loader2 className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
          </label>

          {/* Pickup Suggestions Dropdown */}
          {pickupFocused && pickupSuggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
              {pickupSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickupChange(item.displayName);
                    if (item.lat && item.lon) {
                      setPickupCoords([item.lat, item.lon]);
                    } else {
                      void handleManualGeocode(item.displayName, true);
                    }
                    setPickupSuggestions([]);
                    setPickupFocused(false);
                  }}
                  className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-950"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span className="line-clamp-2 leading-tight">{item.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drop-off Input */}
        <div className={`relative ${dropoffFocused ? "z-50" : "z-20"}`}>
          <label className="text-xs font-medium text-slate-700">
            Drop-off Location *
            <div className="relative mt-1">
              <Navigation className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-600" />
              <input
                ref={dropoffInputRef}
                type="text"
                required
                value={dropoffLocation}
                onChange={(e) => {
                  onDropoffChange(e.target.value);
                  if (!e.target.value) setDropoffCoords(null);
                }}
                onFocus={() => setDropoffFocused(true)}
                onBlur={() => {
                  setTimeout(() => setDropoffFocused(false), 200);
                  if (dropoffLocation && !dropoffCoords) {
                    void handleManualGeocode(dropoffLocation, false);
                  }
                }}
                placeholder="Start typing destination address or landmark…"
                className="klx-input pr-8 pl-9 text-xs"
              />
              {dropoffSearching && (
                <Loader2 className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
          </label>

          {/* Drop-off Suggestions Dropdown */}
          {dropoffFocused && dropoffSuggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
              {dropoffSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDropoffChange(item.displayName);
                    if (item.lat && item.lon) {
                      setDropoffCoords([item.lat, item.lon]);
                    } else {
                      void handleManualGeocode(item.displayName, false);
                    }
                    setDropoffSuggestions([]);
                    setDropoffFocused(false);
                  }}
                  className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-950"
                >
                  <Navigation className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
                  <span className="line-clamp-2 leading-tight">{item.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative z-10 space-y-2">
        <div className="relative h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-xs text-slate-500">
              <Loader2 className="mr-2 size-4 animate-spin text-sky-600" /> Loading interactive map…
            </div>
          )}
        </div>

        {/* Route Summary: Total Distance & Total Price */}
        {effectiveRouteInfo && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs text-sky-950 shadow-xs sm:gap-3 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <Route className="size-4 text-sky-600" />
              <div>
                <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                  Total Distance
                </span>
                <p className="text-xs font-semibold text-slate-900">
                  {effectiveRouteInfo.distance}
                </p>
              </div>
            </div>

            {effectiveRouteInfo.duration && (
              <div className="hidden text-center sm:block">
                <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                  Est. Drive
                </span>
                <p className="text-xs font-medium text-slate-700">{effectiveRouteInfo.duration}</p>
              </div>
            )}

            {effectiveRouteInfo.distanceKm > 0 && (
              <div className="text-right">
                <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                  Total Price
                </span>
                <p className="text-xs font-bold text-sky-700 sm:text-sm">
                  {
                    calculateVehicleFare(
                      selectedVehicle.id,
                      effectiveRouteInfo.distanceKm,
                      activePricing
                    ).formatted
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicle Tier Selection - Live Dynamic Pricing Cards */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-medium text-slate-700">
          Select Car Type &amp; View Fare *
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {VEHICLE_TIERS.map((tier) => {
            const isSelected = selectedVehicle.id === tier.id;
            const fareDetails = effectiveRouteInfo?.distanceKm
              ? calculateVehicleFare(tier.id, effectiveRouteInfo.distanceKm, activePricing)
              : null;
            const tierPricing = activePricing.tiers[tier.id as keyof typeof activePricing.tiers];
            const baseD = tierPricing ? (tierPricing.basePriceCents / 100).toFixed(0) : "50";
            const perKmD = tierPricing ? (tierPricing.pricePerKmCents / 100).toFixed(2) : "2.50";

            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => onVehicleChange(tier.id)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center transition-all sm:px-2 sm:py-2.5 ${
                  isSelected
                    ? "border-sky-600 bg-sky-50/80 font-semibold text-sky-950 shadow-xs ring-1 ring-sky-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[11px] leading-tight font-semibold sm:text-xs">
                    {tier.shortName}
                  </span>
                  {isSelected && <Check className="size-2.5 stroke-[3] text-sky-600 sm:size-3" />}
                </div>
                <span className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">
                  {tier.capacity}
                </span>

                {/* Dynamic Price Display */}
                {fareDetails ? (
                  <div className="mt-1.5 flex flex-col items-center sm:mt-2">
                    <span className="text-xs font-bold text-sky-700 sm:text-sm">
                      {fareDetails.formatted}
                    </span>
                    <span className="text-[8px] text-slate-400 sm:text-[9px]">Total Price</span>
                  </div>
                ) : (
                  <div className="mt-1.5 flex flex-col items-center sm:mt-2">
                    <span className="text-[10px] font-semibold text-slate-800 sm:text-[11px]">
                      From ${baseD}
                    </span>
                    <span className="text-[8px] text-slate-400 sm:text-[9px]">
                      + ${perKmD}/{activePricing.unit === "mile" ? "mi" : "km"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Passenger Count Selection & Dispatch Note */}
      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">
          Passenger Count *
          <select
            value={passengers}
            onChange={(e) => onPassengersChange(Number(e.target.value))}
            className="klx-input mt-1 text-xs"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "Passenger" : "Passengers"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
          <ShieldCheck className="size-4 shrink-0 text-sky-700" />
          <span className="text-[11px] leading-tight">
            Chauffeured reservation · Dispatch confirms vehicle &amp; itinerary details.
          </span>
        </div>
      </div>
    </div>
  );
}
