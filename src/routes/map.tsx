import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/report-ui";
import { WasteMap } from "@/components/WasteMap";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  categoryInfo,
  CITY_CENTER,
  distanceKm,
  PLACE_LABEL,
  PLACES,
  useAppState,
} from "@/lib/waste";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Nearby Bins & Recycling Centres — SmartWaste AI" },
      {
        name: "description",
        content:
          "Find public bins, recycling centres and compost points near you, and see reported garbage locations on a live map.",
      },
      { property: "og:title", content: "Nearby Bins & Recycling Centres — SmartWaste AI" },
      {
        property: "og:description",
        content: "A live map of bins, recycling centres and reported dumping spots in your area.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { reports } = useAppState();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const openReports = reports.filter((r) => r.status !== "resolved");
  const places = PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase()),
  ).sort((a, b) => distanceKm(CITY_CENTER, a) - distanceKm(CITY_CENTER, b));

  const selectedPlace = PLACES.find((p) => p.id === selected);
  const selectedReport = reports.find((r) => r.id === selected);

  return (
    <AppShell>
      <PageHeader
        title="Nearby Bins & Centres"
        subtitle="Green pins are recycling centres, blue are public bins, red are reported waste spots."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-[380px] lg:h-[560px]">
          <WasteMap
            places={PLACES}
            reports={openReports}
            selectedId={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Search bins, centres or areas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {selectedPlace && (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <Badge variant="secondary">{PLACE_LABEL[selectedPlace.type]}</Badge>
              <p className="mt-2 font-semibold">{selectedPlace.name}</p>
              <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
              <p className="mt-1 text-sm">{selectedPlace.hours}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Accepts: {selectedPlace.accepts.map((a) => categoryInfo(a).label).join(", ")}
              </p>
            </div>
          )}

          {selectedReport && (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Reported waste</Badge>
                <StatusBadge status={selectedReport.status} />
              </div>
              <p className="mt-2 font-semibold">{selectedReport.locationName}</p>
              <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
            </div>
          )}

          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {places.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/60",
                  selected === p.id && "border-primary bg-primary/5",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{p.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {distanceKm(CITY_CENTER, p).toFixed(1)} km
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{PLACE_LABEL[p.type]} · {p.hours}</p>
              </button>
            ))}
            {places.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No locations match that search.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
