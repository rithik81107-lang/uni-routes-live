import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, RefreshCw, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classifyWaste, type ScanResult } from "@/lib/scan.functions";
import { CATEGORIES, categoryInfo, compressImage, type WasteCategory } from "@/lib/waste";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "AI Waste Scanner — SmartWaste AI" },
      {
        name: "description",
        content:
          "Take or upload a photo and let AI identify whether the waste is plastic, paper, glass, metal, food, e-waste or mixed.",
      },
      { property: "og:title", content: "AI Waste Scanner — SmartWaste AI" },
      {
        property: "og:description",
        content: "Photograph any waste item and get the category plus the right way to dispose of it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const scan = useServerFn(classifyWaste);
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const cameraInput = useRef<HTMLInputElement | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState<WasteCategory | "">("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPhoto(dataUrl);
      setResult(null);
      setManual("");
      void run(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that image.");
    }
  };

  const run = async (dataUrl: string) => {
    setLoading(true);
    try {
      const res = await scan({ data: { image: dataUrl } });
      setResult(res);
      if (res.unclear) {
        toast.warning("The photo isn't very clear — please confirm the category below.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chosen: WasteCategory | null = manual || result?.category || null;
  const info = chosen ? categoryInfo(chosen) : null;

  return (
    <AppShell>
      <PageHeader
        badge="AI powered"
        title="AI Waste Scanner"
        subtitle="Take a photo of the waste and we'll tell you what it is and how to dispose of it."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
            {photo ? (
              <img src={photo} alt="Waste to scan" className="size-full object-cover" />
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Camera className="mx-auto mb-2 size-8" />
                Take a photo or upload one from your device.
              </div>
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

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => cameraInput.current?.click()} disabled={loading}>
              <Camera className="size-4" /> Take photo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={loading}
            >
              <Upload className="size-4" /> Upload
            </Button>
            {photo && (
              <Button variant="ghost" onClick={() => void run(photo)} disabled={loading}>
                <RefreshCw className="size-4" /> Scan again
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          {loading && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              AI is looking at your photo…
            </div>
          )}

          {!loading && !result && !photo && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Sparkles className="size-6 text-primary" />
              Your result will appear here.
            </div>
          )}

          {!loading && (result || manual) && info && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Identified waste
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {info.emoji} {info.label}
              </h2>
              {result && !manual && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.item} · {Math.round(result.confidence * 100)}% confidence
                </p>
              )}

              <div className="mt-4 rounded-xl bg-primary/8 p-3">
                <p className="text-sm font-semibold text-primary">Recommended disposal</p>
                <p className="mt-1 text-sm">
                  {manual ? info.disposal : result?.disposal || info.disposal}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Bin: {info.binColor}</p>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {(result && !manual && result.tips.length ? result.tips : info.tips).map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {t}
                  </li>
                ))}
              </ul>

              {result?.unclear && !manual && (
                <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                  The image wasn't clear enough to be sure. Please pick the correct category.
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium">Not right? Choose manually</label>
                <Select value={manual} onValueChange={(v) => setManual(v as WasteCategory)}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Select waste category" />
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

              <Button
                className="mt-4 w-full"
                onClick={() =>
                  navigate({
                    to: "/report",
                    search: { category: chosen ?? "mixed" },
                  })
                }
              >
                Report this waste
              </Button>
            </div>
          )}

          {!loading && !result && photo && (
            <div className="flex h-full min-h-40 items-center justify-center text-sm text-muted-foreground">
              Tap “Scan again” to analyse this photo.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
