import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin, User } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge, StatusTrack } from "@/components/report-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  advanceReport,
  categoryInfo,
  STATUS_LABEL,
  timeAgo,
  useAppState,
} from "@/lib/waste";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report details — SmartWaste AI" },
      {
        name: "description",
        content: "See the photo, location, cleanup stage and full timeline of a waste report.",
      },
      { property: "og:title", content: "Report details — SmartWaste AI" },
      {
        property: "og:description",
        content: "Track a single waste report from submission to resolution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const { reports } = useAppState();
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <AppShell>
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">That report could not be found.</p>
          <Button asChild className="mt-4">
            <Link to="/reports">Back to my reports</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const info = categoryInfo(report.category);

  return (
    <AppShell>
      <Link
        to="/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My reports
      </Link>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Report ID</p>
            <h1 className="font-display text-2xl font-semibold">{report.id}</h1>
          </div>
          <StatusBadge status={report.status} />
        </div>

        <div className="mt-5">
          <StatusTrack status={report.status} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            {report.photo ? (
              <img
                src={report.photo}
                alt={`Waste at ${report.locationName}`}
                className="aspect-4/3 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-4/3 items-center justify-center rounded-xl bg-muted text-5xl">
                {info.emoji}
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <Badge variant="outline">
              {info.emoji} {info.label}
            </Badge>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-primary" /> {report.locationName}
            </p>
            <p className="text-muted-foreground">{report.description || "No description added."}</p>
            <p className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              {report.worker ? `Assigned to ${report.worker}` : "Awaiting worker assignment"}
            </p>
            <p className="text-muted-foreground">
              Reported {timeAgo(report.createdAt)} · est. {report.weightKg} kg
            </p>
            <div className="rounded-xl bg-primary/8 p-3">
              <p className="font-semibold text-primary">Recommended disposal</p>
              <p className="mt-1">{info.disposal}</p>
            </div>
            {report.status !== "resolved" && (
              <Button variant="outline" onClick={() => advanceReport(report.id)}>
                Move to next stage
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">Timeline</h2>
          <ol className="mt-3 space-y-3">
            {report.timeline.map((t) => (
              <li key={t.status} className="flex gap-3">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">{STATUS_LABEL[t.status]}</p>
                  <p className="text-xs text-muted-foreground">{t.note}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(t.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
