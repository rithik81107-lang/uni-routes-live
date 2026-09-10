import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { impactStats, resetDemoData, updateProfile, useAppState } from "@/lib/waste";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Impact — SmartWaste AI" },
      {
        name: "description",
        content: "Your details and your personal cleanup impact: reports made, resolved and waste collected.",
      },
      { property: "og:title", content: "Profile & Impact — SmartWaste AI" },
      {
        property: "og:description",
        content: "See how much waste your reports helped remove from the community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, reports } = useAppState();
  const stats = impactStats(reports);
  const [form, setForm] = useState(profile);

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your details and your impact on the community." />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1.5"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="mt-1.5"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="area">Area / ward</Label>
            <Input
              id="area"
              className="mt-1.5"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </div>
          <Button
            onClick={() => {
              updateProfile(form);
              toast.success("Profile saved");
            }}
          >
            Save profile
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Impact dashboard</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Reports submitted" value={stats.total} />
            <Stat label="Reports resolved" value={stats.resolved} />
            <Stat label="Waste collected" value={`${stats.collectedKg} kg`} />
            <Stat label="Recycling locations" value={stats.recyclingSpots} />
            <Stat label="Active cleanups" value={stats.active} />
            <Stat label="CO₂ saved" value={`${stats.co2Saved} kg`} />
          </div>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => {
              resetDemoData();
              toast.success("Demo data reset");
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
