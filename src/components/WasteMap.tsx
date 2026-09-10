/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

import { CITY_CENTER, type Place, type WasteReport } from "@/lib/waste";

declare global {
  interface Window {
    google?: any;
    __smartwasteMapsPromise?: Promise<void>;
  }
}

const KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
  | string
  | undefined;

function loadMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__smartwasteMapsPromise) return window.__smartwasteMapsPromise;
  window.__smartwasteMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=marker`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("map-failed"));
    document.head.appendChild(script);
  });
  return window.__smartwasteMapsPromise;
}

const PIN: Record<string, { color: string; glyph: string }> = {
  bin: { color: "#2563eb", glyph: "🗑️" },
  recycling: { color: "#16a34a", glyph: "♻️" },
  compost: { color: "#a16207", glyph: "🌱" },
  report: { color: "#dc2626", glyph: "⚠️" },
};

function markerIcon(kind: string) {
  const { color } = PIN[kind] ?? PIN["bin"]!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 43C17 43 32 26.5 32 16.5C32 8.2 25.3 1.5 17 1.5C8.7 1.5 2 8.2 2 16.5C2 26.5 17 43 17 43Z"
      fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="17" cy="16.5" r="5.5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function WasteMap({
  places,
  reports,
  selectedId,
  onSelect,
}: {
  places: Place[];
  reports: WasteReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    if (!KEY) return;
    loadMaps()
      .then(() => {
        if (cancelled || !container.current || mapRef.current) return;
        mapRef.current = new window.google.maps.Map(container.current, {
          center: CITY_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const add = (id: string, lat: number, lng: number, title: string, kind: string) => {
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title,
        icon: {
          url: markerIcon(kind),
          scaledSize: new window.google.maps.Size(id === selectedId ? 42 : 30, id === selectedId ? 54 : 39),
        },
      });
      marker.addListener("click", () => selectRef.current(id));
      markersRef.current.push(marker);
    };

    places.forEach((p) => add(p.id, p.lat, p.lng, p.name, p.type));
    reports.forEach((r) => add(r.id, r.lat, r.lng, r.locationName, "report"));
  }, [places, reports, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const target =
      places.find((p) => p.id === selectedId) ?? reports.find((r) => r.id === selectedId);
    if (target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      if (map.getZoom() < 14) map.setZoom(14);
    }
  }, [selectedId, places, reports]);

  if (!KEY) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        The live map is unavailable right now. Use the list below to browse bins and
        recycling centres.
      </div>
    );
  }

  return <div ref={container} className="h-full min-h-[320px] w-full rounded-2xl border" />;
}
