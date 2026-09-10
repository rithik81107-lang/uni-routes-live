import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  categoryInfo,
  STATUS_FLOW,
  STATUS_LABEL,
  timeAgo,
  type ReportStatus,
  type WasteReport,
} from "@/lib/waste";

const STATUS_CLASS: Record<ReportStatus, string> = {
  submitted: "bg-muted text-muted-foreground",
  verified: "bg-primary/12 text-primary",
  assigned: "bg-warning/20 text-warning-foreground",
  cleaning: "bg-accent/25 text-accent-foreground",
  resolved: "bg-success/18 text-success",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusTrack({ status }: { status: ReportStatus }) {
  const current = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[10px] font-bold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {STATUS_LABEL[s]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-4 h-0.5 flex-1 rounded",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ReportCard({ report }: { report: WasteReport }) {
  const info = categoryInfo(report.category);
  return (
    <Link
      to="/reports/$reportId"
      params={{ reportId: report.id }}
      className="block rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {report.photo ? (
          <img
            src={report.photo}
            alt={`Waste reported at ${report.locationName}`}
            className="size-14 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-xl bg-muted text-2xl">
            {info.emoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{report.locationName}</p>
            <Badge variant="outline">{info.label}</Badge>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {report.description || "No description added."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {report.id} · {timeAgo(report.createdAt)}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>
    </Link>
  );
}
