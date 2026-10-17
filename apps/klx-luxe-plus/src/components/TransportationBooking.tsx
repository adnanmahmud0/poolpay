"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Car, Check, Loader2, MapPin, Navigation, Route, ShieldCheck } from "lucide-react";

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

interface OsrmResponse {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: unknown;
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

interface TransportationBookingProps {
  pickupLocation: string;
  onPickupChange: (val: string) => void;
  dropoffLocation: string;
  onDropoffChange: (val: string) => void;
  vehicleClass: string;
  onVehicleChange: (val: string) => void;
  passengers: number;
  onPassengersChange: (val: number) => void;
}

function isRealGoogleKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 25 && !trimmed.startsWith("YOUR_");
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
  onPassengersChange
}: TransportationBookingProps) {
  const selectedVehicle = VEHICLE_TIERS.find((v) => v.id === vehicleClass) || VEHICLE_TIERS[0]!;

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const googleApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBNpPiOGY3KYx0QKjGygXO2l_vuuV2CAPo";
  const [useGoogle, setUseGoogle] = useState(() => isRealGoogleKey(googleApiKey));
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Suggestions state for OpenStreetMap Nominatim
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [dropoffSearching, setDropoffSearching] = useState(false);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);

  // Coordinates for Leaflet map
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  // Leaflet refs
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const leafletPickupMarkerRef = useRef<LeafletMarker | null>(null);
  const leafletDropoffMarkerRef = useRef<LeafletMarker | null>(null);
  const leafletRouteLayerRef = useRef<LeafletLayer | null>(null);

  // Google Maps refs
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleDirectionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

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
      googleMapRef.current = null;
      googleDirectionsRendererRef.current = null;
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
        ".gm-err-container, .gm-err-content, .gm-style-moc, .gm-err-autocomplete"
      );
      if (errNodes.length > 0) {
        triggerFallback("DOM error modal detected");
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
    if (win.google?.maps?.places) {
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry`;
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

        const directionsRenderer = new win.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#0284c7",
            strokeWeight: 4,
            strokeOpacity: 0.9
          }
        });

        googleDirectionsRendererRef.current = directionsRenderer;
        googleMapRef.current = map;
      }

      // Google Places Autocomplete
      if (pickupInputRef.current) {
        const pickupAuto = new win.google.maps.places.Autocomplete(pickupInputRef.current, {
          fields: ["formatted_address", "geometry", "name"]
        });
        pickupAuto.addListener("place_changed", () => {
          const place = pickupAuto.getPlace();
          const address = place.formatted_address || place.name || "";
          onPickupChange(address);
        });
      }

      if (dropoffInputRef.current) {
        const dropoffAuto = new win.google.maps.places.Autocomplete(dropoffInputRef.current, {
          fields: ["formatted_address", "geometry", "name"]
        });
        dropoffAuto.addListener("place_changed", () => {
          const place = dropoffAuto.getPlace();
          const address = place.formatted_address || place.name || "";
          onDropoffChange(address);
        });
      }
    } catch (err) {
      console.warn("Failed initializing Google Maps, falling back to OpenStreetMap:", err);
      googleMapRef.current = null;
      googleDirectionsRendererRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
      queueMicrotask(() => {
        setUseGoogle(false);
        setMapLoaded(false);
      });
    }
  }, [useGoogle, mapLoaded, onPickupChange, onDropoffChange]);

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

          // Luxury CartoDB Voyager tiles (100% free, no API key required)
          L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
            maxZoom: 19,
            subdomains: "abcd"
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
  // 5. OpenStreetMap Autocomplete / Suggestions (Nominatim)
  // ---------------------------------------------------------------------------
  const searchNominatim = useCallback(
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
    if (useGoogle) return;
    const timer = setTimeout(() => {
      if (pickupFocused) {
        searchNominatim(pickupLocation, setPickupSuggestions, setPickupSearching);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pickupLocation, pickupFocused, useGoogle, searchNominatim]);

  // Debounced input search for Drop-off
  useEffect(() => {
    if (useGoogle) return;
    const timer = setTimeout(() => {
      if (dropoffFocused) {
        searchNominatim(dropoffLocation, setDropoffSuggestions, setDropoffSearching);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [dropoffLocation, dropoffFocused, useGoogle, searchNominatim]);

  // ---------------------------------------------------------------------------
  // 6. Update Leaflet Markers & Route (OSRM)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (useGoogle || !mapLoaded) return;
    const win = window as WindowWithMaps;
    const L = win.L;
    const map = leafletMapRef.current;
    if (!L || !map) return;

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

    // Single marker centering
    if (pickupCoords && !dropoffCoords) {
      map.setView(pickupCoords, 13);
    } else if (!pickupCoords && dropoffCoords) {
      map.setView(dropoffCoords, 13);
    }

    // Route calculation via OSRM
    if (pickupCoords && dropoffCoords) {
      const [pLat, pLon] = pickupCoords;
      const [dLat, dLon] = dropoffCoords;
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data: OsrmResponse) => {
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            if (leafletRouteLayerRef.current) {
              map.removeLayer(leafletRouteLayerRef.current);
            }

            leafletRouteLayerRef.current = L.geoJSON(route.geometry, {
              style: {
                color: "#0284c7",
                weight: 5,
                opacity: 0.85
              }
            }).addTo(map);

            const distMiles = (route.distance / 1609.34).toFixed(1);
            const durMins = Math.round(route.duration / 60);
            setRouteInfo({
              distance: `${distMiles} miles`,
              duration: `${durMins} mins`
            });

            const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
            map.fitBounds(bounds, { padding: [40, 40] });
          }
        })
        .catch(() => {
          if (leafletRouteLayerRef.current) {
            map.removeLayer(leafletRouteLayerRef.current);
          }
          leafletRouteLayerRef.current = L.polyline([pickupCoords, dropoffCoords], {
            color: "#0284c7",
            weight: 4
          }).addTo(map);
          map.fitBounds(L.latLngBounds([pickupCoords, dropoffCoords]), { padding: [40, 40] });
        });
    } else {
      if (leafletRouteLayerRef.current) {
        map.removeLayer(leafletRouteLayerRef.current);
        leafletRouteLayerRef.current = null;
      }
      queueMicrotask(() => setRouteInfo(null));
    }
  }, [useGoogle, mapLoaded, pickupCoords, dropoffCoords]);

  // Geocode typed address on blur if not selected from suggestions
  const handleManualGeocode = async (address: string, isPickup: boolean) => {
    if (!address.trim() || useGoogle) return;
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

  const effectiveRouteInfo = pickupLocation && dropoffLocation ? routeInfo : null;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-slate-900">
          <Car className="size-5 text-sky-700" />
          <h4 className="text-sm font-semibold tracking-tight">Luxury Transportation Details</h4>
        </div>
        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
          Chauffeur Service
        </span>
      </div>

      {/* Location Inputs with Autocomplete Dropdowns */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Pickup Input */}
        <div className="relative">
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
          {!useGoogle && pickupFocused && pickupSuggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {pickupSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickupChange(item.displayName);
                    setPickupCoords([item.lat, item.lon]);
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
        <div className="relative">
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
          {!useGoogle && dropoffFocused && dropoffSuggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {dropoffSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDropoffChange(item.displayName);
                    setDropoffCoords([item.lat, item.lon]);
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
      <div className="space-y-2">
        <div className="relative h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-xs text-slate-500">
              <Loader2 className="mr-2 size-4 animate-spin text-sky-600" /> Loading interactive map…
            </div>
          )}
        </div>

        {/* Route Info Pill */}
        {effectiveRouteInfo && (
          <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/90 px-3.5 py-2 text-xs font-medium text-sky-950 shadow-xs">
            <span className="flex items-center gap-1.5">
              <Route className="size-4 text-sky-600" />
              <span>
                Route Distance: <strong>{effectiveRouteInfo.distance}</strong>
              </span>
            </span>
            <span>
              Estimated Drive: <strong>{effectiveRouteInfo.duration}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Vehicle Tier Selection - Compact Minimal Cards */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-medium text-slate-700">Select Car Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TIERS.map((tier) => {
            const isSelected = selectedVehicle.id === tier.id;
            return (
              <button
                type="button"
                key={tier.id}
                onClick={() => onVehicleChange(tier.id)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
                  isSelected
                    ? "border-sky-600 bg-sky-50/80 font-semibold text-sky-950 shadow-xs ring-1 ring-sky-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs leading-tight font-semibold">{tier.shortName}</span>
                  {isSelected && <Check className="size-3 stroke-[3] text-sky-600" />}
                </div>
                <span className="mt-0.5 text-[10px] text-slate-500">{tier.capacity}</span>
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
