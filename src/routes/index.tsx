import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ClipboardList, MapPin, Recycle, Trash2, TrendingUp, Weight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ReportCard } from "@/components/report-ui";
import { Button } from "@/components/ui/button";
import { impactStats, useAppState } from "@/lib/waste";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartWaste AI — Keep Our Community Clean" },
      {
        name: "description",
        content:
          "Scan waste with AI, report dumping spots, find nearby bins and recycling centres, and track cleanups to completion.",
      },
      { property: "og:title", content: "SmartWaste AI — Keep Our Community Clean" },
      {
        property: "og:description",
        content:
          "Photograph garbage, let AI identify the waste type, report the location and follow the cleanup until it is resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const ACTIONS = [
  {
    to: "/scan",
    emoji: "📸",
    title: "Scan Waste",
    text: "Identify waste from a photo",
    icon: Camera,
  },
  {
    to: "/report",
    emoji: "🗑️",
    title: "Report Waste",
    text: "Flag a dumping spot",
    icon: Trash2,
  },
  {
    to: "/map",
    emoji: "📍",
    title: "Nearby Bins",
    text: "Bins & recycling centres",
    icon: MapPin,
  },
  {
    to: "/reports",
    emoji: "📋",
    title: "My Reports",
    text: "Track cleanup status",
    icon: ClipboardList,
  },
] as const;

function HomePage() {
  const { reports, profile } = useAppState();
  const stats = impactStats(reports);
  const recent = reports.slice(0, 3);

  return (
    <AppShell>
      <section className="hero-gradient relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-lift md:px-10 md:py-12">
        <p className="text-sm font-medium opacity-90">Hi {profile.name} 👋</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          SmartWaste AI
        </h1>
        <p className="mt-2 max-w-md text-base opacity-95">Keep Our Community Clean 🌱</p>
        <p className="mt-1 max-w-lg text-sm opacity-80">
          Snap a photo, let AI sort the waste, and follow your report from submitted to resolved.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="lg" variant="secondary">
            <Link to="/scan">Scan waste now</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to="/report">Report a spot</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                <Icon className="size-5" />
              </span>
              <p className="mt-3 font-semibold">
                {a.emoji} {a.title}
              </p>
              <p className="text-xs text-muted-foreground">{a.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Community impact</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={ClipboardList} label="Reports submitted" value={stats.total} />
          <StatCard icon={TrendingUp} label="Reports resolved" value={stats.resolved} />
          <StatCard icon={Weight} label="Waste collected" value={`${stats.collectedKg} kg`} />
          <StatCard icon={Recycle} label="Recycling locations" value={stats.recyclingSpots} />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent reports</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/reports">View all</Link>
          </Button>
        </div>
        <div className="grid gap-3">
          {recent.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Recycle;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <Icon className="size-5 text-primary" />
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
