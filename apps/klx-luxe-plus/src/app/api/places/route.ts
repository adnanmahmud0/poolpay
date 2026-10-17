import { NextResponse } from "next/server";

interface GooglePlacesNewSuggestion {
  placePrediction?: {
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
}

interface GooglePlacesNewResponse {
  suggestions?: GooglePlacesNewSuggestion[];
}

interface GoogleGeocodeResponse {
  status: string;
  results?: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "AIzaSyBNpPiOGY3KYx0QKjGygXO2l_vuuV2CAPo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const address = searchParams.get("address")?.trim();

  // 1. Geocoding request
  if (address) {
    // Try Google Geocoding first
    if (GOOGLE_API_KEY) {
      try {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_API_KEY}`;
        const res = await fetch(geoUrl);
        if (res.ok) {
          const data = (await res.json()) as GoogleGeocodeResponse;
          if (data.status === "OK" && data.results && data.results[0]) {
            const loc = data.results[0].geometry.location;
            return NextResponse.json({
              lat: loc.lat,
              lon: loc.lng,
              displayName: data.results[0].formatted_address
            });
          }
        }
      } catch (err) {
        console.warn("[API Places] Google Geocode error:", err);
      }
    }

    // Fallback to Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`;
      const res = await fetch(nomUrl, {
        headers: { "User-Agent": "KLX-Luxe-Plus/1.0", Accept: "application/json" }
      });
      if (res.ok) {
        const data = (await res.json()) as NominatimResult[];
        if (Array.isArray(data) && data[0]) {
          return NextResponse.json({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name
          });
        }
      }
    } catch (err) {
      console.warn("[API Places] Nominatim Geocode error:", err);
    }

    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  // 2. Autocomplete Suggestions request
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  // Try Google Places (New) autocomplete
  if (GOOGLE_API_KEY) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY
        },
        body: JSON.stringify({ input: query })
      });

      if (res.ok) {
        const data = (await res.json()) as GooglePlacesNewResponse;
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          const suggestions = data.suggestions
            .map((item) => {
              const fullText = item.placePrediction?.text?.text;
              const mainText = item.placePrediction?.structuredFormat?.mainText?.text;
              const secondaryText = item.placePrediction?.structuredFormat?.secondaryText?.text;
              const displayName =
                fullText ||
                (mainText && secondaryText ? `${mainText}, ${secondaryText}` : mainText) ||
                "";
              return { displayName, lat: 0, lon: 0 };
            })
            .filter((s) => s.displayName);

          if (suggestions.length > 0) {
            return NextResponse.json({ suggestions });
          }
        }
      }
    } catch (err) {
      console.warn("[API Places] Google Places Autocomplete error:", err);
    }
  }

  // Fallback to Nominatim Autocomplete
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=6&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: { "User-Agent": "KLX-Luxe-Plus/1.0", Accept: "application/json" }
    });
    if (res.ok) {
      const data = (await res.json()) as NominatimResult[];
      if (Array.isArray(data)) {
        const suggestions = data.map((item) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));
        return NextResponse.json({ suggestions });
      }
    }
  } catch (err) {
    console.warn("[API Places] Nominatim search error:", err);
  }

  return NextResponse.json({ suggestions: [] });
}
