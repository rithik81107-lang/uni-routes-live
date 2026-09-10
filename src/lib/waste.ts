/**
 * SmartWaste AI — shared domain data and a small local-first store.
 * Reports live in the browser (localStorage) so the whole workflow can be
 * demonstrated without any account setup.
 */
import { useSyncExternalStore } from "react";

export type WasteCategory =
  | "plastic"
  | "paper"
  | "glass"
  | "metal"
  | "food"
  | "ewaste"
  | "mixed";

export type CategoryInfo = {
  id: WasteCategory;
  label: string;
  emoji: string;
  binColor: string;
  disposal: string;
  tips: string[];
  recyclable: boolean;
};

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "plastic",
    label: "Plastic",
    emoji: "🥤",
    binColor: "Blue bin (dry recyclables)",
    disposal: "Rinse, flatten and drop into the blue dry-waste bin for recycling.",
    tips: [
      "Empty and rinse bottles so they can actually be recycled",
      "Remove caps and labels where possible",
      "Never burn plastic — it releases toxic fumes",
    ],
    recyclable: true,
  },
  {
    id: "paper",
    label: "Paper",
    emoji: "📄",
    binColor: "Blue bin (dry recyclables)",
    disposal: "Keep it dry, flatten cartons and hand it to a paper recycler.",
    tips: [
      "Wet or oily paper (pizza boxes) goes to wet waste instead",
      "Staples and tape should be removed",
      "Shredded paper is best bagged before recycling",
    ],
    recyclable: true,
  },
  {
    id: "glass",
    label: "Glass",
    emoji: "🍾",
    binColor: "Blue bin (handle with care)",
    disposal: "Rinse the container and place it upright in the glass collection point.",
    tips: [
      "Wrap broken glass in newspaper and label it clearly",
      "Do not mix mirror or window glass with bottle glass",
      "Return deposit bottles to the shop where possible",
    ],
    recyclable: true,
  },
  {
    id: "metal",
    label: "Metal",
    emoji: "🥫",
    binColor: "Blue bin (dry recyclables)",
    disposal: "Rinse cans and foil, then give them to a scrap or recycling centre.",
    tips: [
      "Metal is infinitely recyclable — never send it to landfill",
      "Aerosol cans must be fully empty before disposal",
      "Collect small scrap in one bag to make it worth recycling",
    ],
    recyclable: true,
  },
  {
    id: "food",
    label: "Food Waste",
    emoji: "🍎",
    binColor: "Green bin (wet waste)",
    disposal: "Put it in the green wet-waste bin or a home compost pit.",
    tips: [
      "Drain liquids before binning to reduce smell",
      "Compost peels and leftovers to make free fertiliser",
      "Keep wet waste separate — it contaminates dry recyclables",
    ],
    recyclable: false,
  },
  {
    id: "ewaste",
    label: "E-Waste",
    emoji: "🔌",
    binColor: "Red / e-waste collection point",
    disposal: "Hand over to an authorised e-waste collection centre — never street bins.",
    tips: [
      "Wipe personal data from phones and laptops first",
      "Batteries must never go into normal bins",
      "Many shops run take-back programmes for old electronics",
    ],
    recyclable: true,
  },
  {
    id: "mixed",
    label: "Mixed Waste",
    emoji: "🗑️",
    binColor: "Segregate before disposal",
    disposal: "Separate wet, dry and hazardous items, then dispose of each correctly.",
    tips: [
      "Segregation at source is the single biggest win",
      "Report large mixed dumps so the municipal team can clear them",
      "Keep two bins at home: one green, one blue",
    ],
    recyclable: false,
  },
];

export function categoryInfo(id: WasteCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

/* ---------------------------------------------------------------- statuses */

export type ReportStatus = "submitted" | "verified" | "assigned" | "cleaning" | "resolved";

export const STATUS_FLOW: ReportStatus[] = [
  "submitted",
  "verified",
  "assigned",
  "cleaning",
  "resolved",
];

export const STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: "Submitted",
  verified: "Verified",
  assigned: "Assigned",
  cleaning: "Cleaning",
  resolved: "Resolved",
};

export const STATUS_NOTE: Record<ReportStatus, string> = {
  submitted: "Report received and queued for review.",
  verified: "A supervisor confirmed the waste at this location.",
  assigned: "A cleanup worker has been assigned to this report.",
  cleaning: "The cleanup crew has started work on site.",
  resolved: "Waste collected and the spot is clean again.",
};

/** Demo timings (ms) for the automatic workflow simulation. */
const STATUS_DELAY: Record<ReportStatus, number> = {
  submitted: 8000,
  verified: 10000,
  assigned: 12000,
  cleaning: 14000,
  resolved: Number.POSITIVE_INFINITY,
};

export function nextStatus(status: ReportStatus): ReportStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1]! : null;
}

/* ------------------------------------------------------------------- types */

export type TimelineEntry = { status: ReportStatus; at: number; note: string };

export type WasteReport = {
  id: string;
  category: WasteCategory;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  photo: string | null;
  createdAt: number;
  updatedAt: number;
  status: ReportStatus;
  weightKg: number;
  worker: string | null;
  timeline: TimelineEntry[];
};

export type AppNotification = {
  id: string;
  reportId: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
};

export type Profile = { name: string; email: string; area: string };

export type PlaceType = "bin" | "recycling" | "compost";

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  address: string;
  hours: string;
  accepts: WasteCategory[];
};

export const PLACE_LABEL: Record<PlaceType, string> = {
  bin: "Public bin",
  recycling: "Recycling centre",
  compost: "Compost point",
};

/* ------------------------------------------------------------------ places */

export const CITY_CENTER = { lat: 22.5726, lng: 88.3639 };

export const PLACES: Place[] = [
  {
    id: "p1",
    name: "Park Street Segregation Bins",
    type: "bin",
    lat: 22.5535,
    lng: 88.3529,
    address: "Park Street, near Music World crossing",
    hours: "Open 24 hours",
    accepts: ["plastic", "paper", "food", "mixed"],
  },
  {
    id: "p2",
    name: "Salt Lake Recycling Centre",
    type: "recycling",
    lat: 22.5867,
    lng: 88.4171,
    address: "Sector V, Salt Lake City",
    hours: "Mon–Sat, 9:00 AM – 6:00 PM",
    accepts: ["plastic", "paper", "glass", "metal", "ewaste"],
  },
  {
    id: "p3",
    name: "Gariahat Market Bins",
    type: "bin",
    lat: 22.5186,
    lng: 88.3639,
    address: "Gariahat Road, opposite the flyover",
    hours: "Open 24 hours",
    accepts: ["food", "plastic", "mixed"],
  },
  {
    id: "p4",
    name: "Green Earth E-Waste Point",
    type: "recycling",
    lat: 22.5647,
    lng: 88.4012,
    address: "EM Bypass, Beliaghata",
    hours: "Tue–Sun, 10:00 AM – 7:00 PM",
    accepts: ["ewaste", "metal", "glass"],
  },
  {
    id: "p5",
    name: "Rabindra Sarobar Compost Pit",
    type: "compost",
    lat: 22.5109,
    lng: 88.3564,
    address: "Lake Gardens gate no. 3",
    hours: "Daily, 6:00 AM – 8:00 PM",
    accepts: ["food"],
  },
  {
    id: "p6",
    name: "Howrah Station Smart Bins",
    type: "bin",
    lat: 22.5839,
    lng: 88.3425,
    address: "Howrah Station, platform 8 exit",
    hours: "Open 24 hours",
    accepts: ["plastic", "paper", "mixed"],
  },
  {
    id: "p7",
    name: "New Town Materials Recovery",
    type: "recycling",
    lat: 22.6187,
    lng: 88.4527,
    address: "Action Area I, New Town",
    hours: "Mon–Fri, 8:00 AM – 5:00 PM",
    accepts: ["plastic", "paper", "glass", "metal"],
  },
  {
    id: "p8",
    name: "Ballygunge Ward Compost Yard",
    type: "compost",
    lat: 22.5296,
    lng: 88.3663,
    address: "Ballygunge Circular Road",
    hours: "Daily, 7:00 AM – 6:00 PM",
    accepts: ["food", "paper"],
  },
];

/* ------------------------------------------------------------------- state */

export type AppState = {
  reports: WasteReport[];
  notifications: AppNotification[];
  profile: Profile;
};

const STORAGE_KEY = "smartwaste-ai:v1";

function hoursAgo(h: number) {
  return Date.now() - h * 3600_000;
}

function timelineUpTo(status: ReportStatus, start: number): TimelineEntry[] {
  const upto = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1);
  return upto.map((s, i) => ({
    status: s,
    at: start + i * 3600_000,
    note: STATUS_NOTE[s],
  }));
}

function demoReport(
  id: string,
  category: WasteCategory,
  locationName: string,
  lat: number,
  lng: number,
  description: string,
  status: ReportStatus,
  hours: number,
  weightKg: number,
  worker: string | null,
): WasteReport {
  const created = hoursAgo(hours);
  const timeline = timelineUpTo(status, created);
  return {
    id,
    category,
    locationName,
    lat,
    lng,
    description,
    photo: null,
    createdAt: created,
    updatedAt: timeline[timeline.length - 1]!.at,
    status,
    weightKg,
    worker,
    timeline,
  };
}

function seedState(): AppState {
  const reports: WasteReport[] = [
    demoReport(
      "SW-4821",
      "plastic",
      "Park Street footpath",
      22.5541,
      88.3512,
      "Pile of plastic bottles and wrappers next to the bus stop.",
      "resolved",
      54,
      12,
      "Ward 63 crew",
    ),
    demoReport(
      "SW-4822",
      "mixed",
      "Gariahat market lane",
      22.5192,
      88.3648,
      "Mixed household garbage dumped at the corner of the lane.",
      "cleaning",
      9,
      26,
      "Rakesh D.",
    ),
    demoReport(
      "SW-4823",
      "ewaste",
      "Salt Lake Sector V pavement",
      22.5873,
      88.4159,
      "Old monitors and cables left on the pavement.",
      "assigned",
      5,
      18,
      "E-waste unit 2",
    ),
    demoReport(
      "SW-4824",
      "food",
      "Behind Ballygunge canteen",
      22.5302,
      88.3671,
      "Food waste overflowing from the community bin.",
      "verified",
      2,
      9,
      null,
    ),
  ];
  return {
    reports,
    notifications: [
      {
        id: "n1",
        reportId: "SW-4822",
        title: "Cleanup started",
        body: "The crew has started clearing Gariahat market lane.",
        at: hoursAgo(1),
        read: false,
      },
      {
        id: "n2",
        reportId: "SW-4823",
        title: "Worker assigned",
        body: "E-waste unit 2 is on the way to Salt Lake Sector V.",
        at: hoursAgo(3),
        read: false,
      },
      {
        id: "n3",
        reportId: "SW-4821",
        title: "Report resolved",
        body: "Park Street footpath is clean — 12 kg of waste collected.",
        at: hoursAgo(48),
        read: true,
      },
    ],
    profile: { name: "Rithik", email: "rithik@example.com", area: "Ward 63, Kolkata" },
  };
}

let state: AppState = seedState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — keep the in-memory state */
  }
}

function setState(next: AppState) {
  state = next;
  persist();
  emit();
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.reports && parsed.notifications && parsed.profile) {
        state = parsed;
      }
    }
  } catch {
    /* corrupt data — fall back to the seeded demo state */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = state;

export function useAppState(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot,
  );
}

/* ----------------------------------------------------------------- actions */

function makeId() {
  return `SW-${Math.floor(1000 + Math.random() * 8999)}`;
}

export function createReport(input: {
  category: WasteCategory;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  photo: string | null;
}): WasteReport {
  const now = Date.now();
  const report: WasteReport = {
    id: makeId(),
    category: input.category,
    locationName: input.locationName,
    lat: input.lat,
    lng: input.lng,
    description: input.description,
    photo: input.photo,
    createdAt: now,
    updatedAt: now,
    status: "submitted",
    weightKg: Math.round(4 + Math.random() * 20),
    worker: null,
    timeline: [{ status: "submitted", at: now, note: STATUS_NOTE.submitted }],
  };
  const notification: AppNotification = {
    id: `${now}`,
    reportId: report.id,
    title: `Report ${report.id} submitted`,
    body: `Thanks! We received your report for ${report.locationName}.`,
    at: now,
    read: false,
  };
  setState({
    ...state,
    reports: [report, ...state.reports],
    notifications: [notification, ...state.notifications],
  });
  return report;
}

const WORKERS = ["Rakesh D.", "Sunita M.", "Ward 63 crew", "Green Squad 4", "Amit K."];

function advanced(report: WasteReport, at: number): { report: WasteReport; note: AppNotification } {
  const next = nextStatus(report.status)!;
  const worker =
    next === "assigned" ? WORKERS[Math.floor(Math.random() * WORKERS.length)]! : report.worker;
  const titles: Record<ReportStatus, string> = {
    submitted: "Report submitted",
    verified: "Report verified",
    assigned: "Worker assigned",
    cleaning: "Cleanup started",
    resolved: "Cleanup completed",
  };
  const bodies: Record<ReportStatus, string> = {
    submitted: `Report ${report.id} was received.`,
    verified: `Report ${report.id} at ${report.locationName} was verified by the ward supervisor.`,
    assigned: `${worker ?? "A worker"} has been assigned to ${report.locationName}.`,
    cleaning: `Cleanup has started at ${report.locationName}.`,
    resolved: `${report.locationName} is clean — about ${report.weightKg} kg collected.`,
  };
  return {
    report: {
      ...report,
      status: next,
      worker,
      updatedAt: at,
      timeline: [...report.timeline, { status: next, at, note: STATUS_NOTE[next] }],
    },
    note: {
      id: `${at}-${report.id}`,
      reportId: report.id,
      title: titles[next],
      body: bodies[next],
      at,
      read: false,
    },
  };
}

export function advanceReport(id: string) {
  const at = Date.now();
  const target = state.reports.find((r) => r.id === id);
  if (!target || target.status === "resolved") return;
  const { report, note } = advanced(target, at);
  setState({
    ...state,
    reports: state.reports.map((r) => (r.id === id ? report : r)),
    notifications: [note, ...state.notifications],
  });
}

/** Moves pending reports forward over time so the full workflow is visible. */
export function tick() {
  const now = Date.now();
  let changed = false;
  const notes: AppNotification[] = [];
  const reports = state.reports.map((r) => {
    if (r.status === "resolved") return r;
    if (now - r.updatedAt < STATUS_DELAY[r.status]) return r;
    const res = advanced(r, now);
    notes.push(res.note);
    changed = true;
    return res.report;
  });
  if (!changed) return;
  setState({ ...state, reports, notifications: [...notes, ...state.notifications] });
}

export function markNotificationsRead() {
  if (!state.notifications.some((n) => !n.read)) return;
  setState({
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  });
}

export function updateProfile(profile: Profile) {
  setState({ ...state, profile });
}

export function resetDemoData() {
  setState(seedState());
}

/* ------------------------------------------------------------------ derive */

export function impactStats(reports: WasteReport[]) {
  const resolved = reports.filter((r) => r.status === "resolved");
  const collected = resolved.reduce((sum, r) => sum + r.weightKg, 0);
  const active = reports.filter((r) => r.status !== "resolved").length;
  return {
    total: reports.length,
    resolved: resolved.length,
    active,
    collectedKg: collected,
    recyclingSpots: PLACES.filter((p) => p.type !== "bin").length,
    binCount: PLACES.length,
    co2Saved: Math.round(collected * 1.8),
  };
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Downscales a picked image so it fits comfortably in local storage. */
export function compressImage(file: File, maxSize = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
