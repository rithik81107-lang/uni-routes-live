import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, LocateFixed, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CITY_CENTER,
  compressImage,
  createReport,
  type WasteCategory,
} from "@/lib/waste";

type ReportSearch = { category?: WasteCategory };

export const Route = createFileRoute("/report")({
  validateSearch: (search: Record<string, unknown>): ReportSearch => {
    const raw = String(search["category"] ?? "");
    const match = CATEGORIES.find((c) => c.id === raw);
    return match ? { category: match.id } : {};
  },
  head: () => ({
    meta: [
      { title: "Report Waste — SmartWaste AI" },
      {
        name: "description",
        content:
          "Report an illegal dumping spot with a photo, waste category, location and description, and get a tracking ID.",
      },
      { property: "og:title", content: "Report Waste — SmartWaste AI" },
      {
        property: "og:description",
        content: "Submit a waste complaint in seconds and follow it through to cleanup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { category: presetCategory } = Route.useSearch();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const cameraInput = useRef<HTMLInputElement | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [category, setCategory] = useState<WasteCategory | "">(presetCategory ?? "");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(CITY_CENTER);
  const [description, setDescription] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that image.");
    }
  };

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location is not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(
          `Near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
        setLocating(false);
        toast.success("Location added.");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — please type it in.");
      },
      { timeout: 8000 },
    );
  };

  const submit = () => {
    if (!category) return toast.error("Please choose a waste category.");
    if (!location.trim()) return toast.error("Please add the location.");

    setSubmitting(true);
    const jitter = () => (Math.random() - 0.5) * 0.04;
    const report = createReport({
      category,
      locationName: location.trim(),
      lat: coords.lat + (coords === CITY_CENTER ? jitter() : 0),
      lng: coords.lng + (coords === CITY_CENTER ? jitter() : 0),
      description: description.trim(),
      photo,
    });

    toast.success(`Report ${report.id} submitted`, {
      description: "We'll notify you as the cleanup progresses.",
    });
    navigate({ to: "/reports/$reportId", params: { reportId: report.id } });
  };

  return (
    <AppShell>
      <PageHeader
        title="Report Waste"
        subtitle="Tell us what you found and where — you'll get a tracking ID straight away."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <Label>Photo</Label>
          <div className="mt-2 flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
            {photo ? (
              <img src={photo} alt="Reported waste" className="size-full object-cover" />
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Add a photo so the cleanup team knows what to expect.
              </p>
            )}
          </div>
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => cameraInput.current?.click()}>
              <Camera className="size-4" /> Camera
            </Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" /> Upload
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div>
            <Label>Waste category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as WasteCategory)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="location"
                placeholder="Street, landmark or area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Button variant="outline" onClick={detectLocation} disabled={locating}>
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LocateFixed className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="mt-1.5"
              rows={4}
              placeholder="How much waste is there? How long has it been lying around?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button className="w-full" size="lg" onClick={submit} disabled={submitting}>
            Submit report
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
