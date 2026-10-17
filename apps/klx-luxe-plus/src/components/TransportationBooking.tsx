"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Car, Check, MapPin, Navigation, Route, ShieldCheck } from "lucide-react";

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

const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBNpPiOGY3KYx0QKjGygXO2l_vuuV2CAPo";

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

  const [mapLoaded, setMapLoaded] = useState(
    () => typeof window !== "undefined" && Boolean(window.google?.maps?.places)
  );
  const [mapError, setMapError] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onPickupChangeRef = useRef(onPickupChange);
  const onDropoffChangeRef = useRef(onDropoffChange);
  useEffect(() => {
    onPickupChangeRef.current = onPickupChange;
    onDropoffChangeRef.current = onDropoffChange;
  });

  // Update map markers when addresses change
  const updatePickupMarker = useCallback((loc: google.maps.LatLng, title: string) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new window.google.maps.Marker({
        position: loc,
        map: mapInstanceRef.current,
        title: `Pickup: ${title}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
    } else {
      pickupMarkerRef.current.setPosition(loc);
      pickupMarkerRef.current.setTitle(`Pickup: ${title}`);
      pickupMarkerRef.current.setMap(mapInstanceRef.current);
    }
    if (!dropoffMarkerRef.current) {
      mapInstanceRef.current.panTo(loc);
      mapInstanceRef.current.setZoom(13);
    }
  }, []);

  const updateDropoffMarker = useCallback((loc: google.maps.LatLng, title: string) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = new window.google.maps.Marker({
        position: loc,
        map: mapInstanceRef.current,
        title: `Drop-off: ${title}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#0284c7",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
    } else {
      dropoffMarkerRef.current.setPosition(loc);
      dropoffMarkerRef.current.setTitle(`Drop-off: ${title}`);
      dropoffMarkerRef.current.setMap(mapInstanceRef.current);
    }
    if (!pickupMarkerRef.current) {
      mapInstanceRef.current.panTo(loc);
      mapInstanceRef.current.setZoom(13);
    }
  }, []);

  const geocodeAddress = useCallback(
    (address: string, isPickup: boolean) => {
      if (!address?.trim() || !window.google?.maps || !geocoderRef.current) return;
      geocoderRef.current.geocode({ address: address.trim() }, (results, status) => {
        if (status === "OK" && results && results[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          if (isPickup) {
            updatePickupMarker(loc, address);
          } else {
            updateDropoffMarker(loc, address);
          }
        }
      });
    },
    [updatePickupMarker, updateDropoffMarker]
  );

  // Load Google Maps script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places) {
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setMapLoaded(true));
      existingScript.addEventListener("error", () => setMapError(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Map, Autocomplete, and Geocoder once script is ready
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps) return;

    // Setup Geocoder
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    // Setup Map
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const defaultCenter = { lat: 40.7128, lng: -74.006 }; // New York Metro
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
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

      // Directions Renderer
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#0284c7",
          strokeWeight: 4,
          strokeOpacity: 0.9
        }
      });
      directionsRendererRef.current = directionsRenderer;
      mapInstanceRef.current = map;
    }

    // Setup Pickup Autocomplete
    if (pickupInputRef.current) {
      const pickupAuto = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        fields: ["formatted_address", "geometry", "name"]
      });
      pickupAuto.addListener("place_changed", () => {
        const place = pickupAuto.getPlace();
        const address = place.formatted_address || place.name || "";
        onPickupChangeRef.current(address);
        if (place.geometry?.location) {
          updatePickupMarker(place.geometry.location, address);
        }
      });
    }

    // Setup Dropoff Autocomplete
    if (dropoffInputRef.current) {
      const dropoffAuto = new window.google.maps.places.Autocomplete(dropoffInputRef.current, {
        fields: ["formatted_address", "geometry", "name"]
      });
      dropoffAuto.addListener("place_changed", () => {
        const place = dropoffAuto.getPlace();
        const address = place.formatted_address || place.name || "";
        onDropoffChangeRef.current(address);
        if (place.geometry?.location) {
          updateDropoffMarker(place.geometry.location, address);
        }
      });
    }
  }, [mapLoaded, updatePickupMarker, updateDropoffMarker]);

  // Sync pickup marker when pickupLocation changes
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps) return;
    if (!pickupLocation) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
        pickupMarkerRef.current = null;
      }
      return;
    }
    const timer = setTimeout(() => {
      geocodeAddress(pickupLocation, true);
    }, 600);
    return () => clearTimeout(timer);
  }, [pickupLocation, mapLoaded, geocodeAddress]);

  // Sync dropoff marker when dropoffLocation changes
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps) return;
    if (!dropoffLocation) {
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setMap(null);
        dropoffMarkerRef.current = null;
      }
      return;
    }
    const timer = setTimeout(() => {
      geocodeAddress(dropoffLocation, false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dropoffLocation, mapLoaded, geocodeAddress]);

  // Calculate driving directions when both locations exist
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps) return;

    if (!pickupLocation || !dropoffLocation) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({
          routes: []
        } as unknown as google.maps.DirectionsResult);
      }
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickupLocation,
        destination: dropoffLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === "OK" && result && directionsRendererRef.current && mapInstanceRef.current) {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0]?.legs[0];
          if (route?.distance && route?.duration) {
            setRouteInfo({
              distance: route.distance.text,
              duration: route.duration.text
            });
          } else {
            setRouteInfo(null);
          }
          if (result.routes[0]?.bounds) {
            mapInstanceRef.current.fitBounds(result.routes[0].bounds);
          }
        } else {
          setRouteInfo(null);
        }
      }
    );
  }, [mapLoaded, pickupLocation, dropoffLocation]);

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

      {/* Location Inputs with Google Autocomplete */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">
          Pickup Location *
          <div className="relative mt-1">
            <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-600" />
            <input
              ref={pickupInputRef}
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => onPickupChange(e.target.value)}
              onBlur={() => geocodeAddress(pickupLocation, true)}
              placeholder="Start typing hotel, airport, or address…"
              className="klx-input pl-9 text-xs"
            />
          </div>
        </label>

        <label className="text-xs font-medium text-slate-700">
          Drop-off Location *
          <div className="relative mt-1">
            <Navigation className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-600" />
            <input
              ref={dropoffInputRef}
              type="text"
              required
              value={dropoffLocation}
              onChange={(e) => onDropoffChange(e.target.value)}
              onBlur={() => geocodeAddress(dropoffLocation, false)}
              placeholder="Start typing destination address or landmark…"
              className="klx-input pl-9 text-xs"
            />
          </div>
        </label>
      </div>

      {/* Google Map Container showing pickup, dropoff and route */}
      <div className="space-y-2">
        <div className="relative h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full" />
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-xs text-slate-500">
              Loading Google Maps…
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-4 text-center text-xs text-slate-500">
              Interactive map preview unavailable. You can still type your pickup & drop-off
              addresses above.
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

      {/* Vehicle Tier Selection - Minimized Compact Pills */}
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

      {/* Passenger Count Selection & Minimal Dispatch Note */}
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
