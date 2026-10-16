"use client";

import { useEffect, useRef, useState } from "react";

import {
  Briefcase,
  Car,
  Check,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Users
} from "lucide-react";

export interface VehicleTier {
  id: string;
  name: string;
  passengers: string;
  luggage: string;
  description: string;
  features: string[];
}

export const VEHICLE_TIERS: VehicleTier[] = [
  {
    id: "executive_sedan",
    name: "Executive Sedan",
    passengers: "1–3 passengers",
    luggage: "2–3 bags",
    description:
      "Mercedes-Benz S-Class / BMW 7 Series. Hand-stitched leather interior, dual-zone climate, quiet cabin.",
    features: [
      "Chauffeur in executive attire",
      "Bottled water & mobile chargers",
      "Flight & traffic tracking"
    ]
  },
  {
    id: "luxury_suv",
    name: "Luxury SUV",
    passengers: "1–6 passengers",
    luggage: "5–6 bags",
    description:
      "Cadillac Escalade / Lincoln Navigator. Spacious captain seating with generous luggage capacity and privacy tint.",
    features: [
      "All-wheel-drive luxury capability",
      "Executive privacy & acoustics",
      "Complimentary meet & greet"
    ]
  },
  {
    id: "vip_sprinter",
    name: "VIP Executive Sprinter",
    passengers: "1–12 passengers",
    luggage: "10–12 bags",
    description:
      "Custom Mercedes Sprinter. High-roof walk-in cabin, captain leather club chairs, and executive boardroom table.",
    features: [
      "Onboard high-speed Wi-Fi",
      "USB-C ports at every seat",
      "Ideal for delegations & VIP teams"
    ]
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

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [activePinMode, setActivePinMode] = useState<"pickup" | "dropoff" | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Load Google Maps script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places) {
      setMapLoaded(true);
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

      // Click on Map to add location
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !geocoderRef.current) return;
        const latLng = e.latLng;

        geocoderRef.current.geocode({ location: latLng }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const formatted = results[0].formatted_address;
            if (activePinMode === "dropoff") {
              onDropoffChange(formatted);
              updateDropoffMarker(latLng, formatted);
              setActivePinMode(null);
            } else {
              // Default to pickup or explicitly chosen pickup
              onPickupChange(formatted);
              updatePickupMarker(latLng, formatted);
              setActivePinMode(null);
            }
          }
        });
      });
    }

    // Setup Pickup Autocomplete
    if (pickupInputRef.current) {
      const pickupAuto = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        fields: ["formatted_address", "geometry", "name"]
      });
      pickupAuto.addListener("place_changed", () => {
        const place = pickupAuto.getPlace();
        const address = place.formatted_address || place.name || "";
        onPickupChange(address);
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
        onDropoffChange(address);
        if (place.geometry?.location) {
          updateDropoffMarker(place.geometry.location, address);
        }
      });
    }
  }, [mapLoaded]);

  // Update map markers when addresses change
  const updatePickupMarker = (loc: google.maps.LatLng, title: string) => {
    if (!mapInstanceRef.current) return;
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
    }
    mapInstanceRef.current.panTo(loc);
  };

  const updateDropoffMarker = (loc: google.maps.LatLng, title: string) => {
    if (!mapInstanceRef.current) return;
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
    }
  };

  // Calculate driving directions when both locations exist
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps || !pickupLocation || !dropoffLocation) {
      setRouteInfo(null);
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
          }
          if (result.routes[0]?.bounds) {
            mapInstanceRef.current.fitBounds(result.routes[0].bounds);
          }
        }
      }
    );
  }, [mapLoaded, pickupLocation, dropoffLocation]);

  // Use HTML5 Geolocation to set Current Location as Pickup
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const latLng = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const formatted = results[0].formatted_address;
              onPickupChange(formatted);
              updatePickupMarker(latLng, formatted);
            }
          });
        }
      },
      () => {
        setLocatingUser(false);
        alert("Unable to retrieve your current location. Please type your pickup address.");
      },
      { timeout: 10000 }
    );
  };

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
              placeholder="Start typing destination address or landmark…"
              className="klx-input pl-9 text-xs"
            />
          </div>
        </label>
      </div>

      {/* Map Interactive Toolbar & "Add Map Location" */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-600">
            {activePinMode === "pickup"
              ? "🎯 Click anywhere on the map to set Pickup location"
              : activePinMode === "dropoff"
                ? "🎯 Click anywhere on the map to set Drop-off location"
                : "Type location above, or tap a button below to pin directly on the map:"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActivePinMode(activePinMode === "pickup" ? null : "pickup")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                activePinMode === "pickup"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <MapPin className="size-3 text-emerald-500" />
              Pin Pickup
            </button>
            <button
              type="button"
              onClick={() => setActivePinMode(activePinMode === "dropoff" ? null : "dropoff")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                activePinMode === "dropoff"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Navigation className="size-3 text-sky-500" />
              Pin Drop-off
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingUser}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <LocateFixed className="size-3 text-slate-500" />
              {locatingUser ? "Locating…" : "My Location"}
            </button>
          </div>
        </div>

        {/* Google Map Container */}
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
        {routeInfo && (
          <div className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900">
            <span className="flex items-center gap-1.5">
              <Route className="size-4 text-sky-600" />
              <span>
                Route Distance: <strong>{routeInfo.distance}</strong>
              </span>
            </span>
            <span>
              Estimated Drive: <strong>{routeInfo.duration}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Vehicle Tier Selection - CAR TYPE WITH NO PRICE */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-slate-800">Select Car Type *</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {VEHICLE_TIERS.map((tier) => {
            const isSelected = selectedVehicle.id === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => onVehicleChange(tier.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? "border-sky-600 bg-white shadow-md ring-2 ring-sky-500/20"
                    : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{tier.name}</span>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3 text-slate-400" />
                          {tier.passengers}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="size-3 text-slate-400" />
                          {tier.luggage}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-xs">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-5 text-slate-600">{tier.description}</p>
                </div>

                <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    Chauffeur Included
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passenger Count Selection */}
      <div className="grid gap-4 pt-1 sm:grid-cols-2">
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

        {/* Private Chauffeur Assurance Box (NO PAY NOW) */}
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/80 px-3.5 py-2.5 text-xs text-sky-950">
          <ShieldCheck className="size-5 shrink-0 text-sky-700" />
          <p className="text-[11px] leading-4 text-sky-900">
            <strong>Private Reservation:</strong> Send your itinerary request with zero upfront
            charge. Our dispatch team confirms vehicle availability and itinerary details.
          </p>
        </div>
      </div>
    </div>
  );
}
