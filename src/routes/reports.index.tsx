import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { ReportCard } from "@/components/report-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_FLOW, STATUS_LABEL, useAppState, type ReportStatus } from "@/lib/waste";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "My Reports — SmartWaste AI" },
      {
        name: "description",
        content:
          "Track every waste report you submitted from Submitted to Verified, Assigned, Cleaning and Resolved.",
      },
      { property: "og:title", content: "My Reports — SmartWaste AI" },
      {
        property: "og:description",
        content: "Follow your waste complaints through each cleanup stage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { reports } = useAppState();
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [query, setQuery] = useState("");

  const list = reports.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (r.locationName.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell>
      <PageHeader title="My Reports" subtitle="Every report you submitted and its live status." />

      <Input
        placeholder="Search by location or report ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {(["all", ...STATUS_FLOW] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {list.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
        {list.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No reports here yet.
          </p>
        )}
      </div>
    </AppShell>
  );
}
