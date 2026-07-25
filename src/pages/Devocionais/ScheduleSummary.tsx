import dayjs from "dayjs";
import type { Devocional } from "@/lib/clients/devocionais";
import { DataCard } from "@/components/molecules";

/** Same red/amber/green ramp as CADENCE_STATE_COLOR on the Videos page: red once
 * you're inside 2 days of running dry, amber inside 5, green otherwise. */
function runwayTone(daysAhead: number | null): string {
  if (daysAhead === null || daysAhead <= 2) return "#dc2626";
  if (daysAhead <= 5) return "#f59e0b";
  return "#16a34a";
}

export function ScheduleSummary({ devocionais }: { devocionais: Devocional[] }) {
  const scheduled = devocionais.filter((d) => d.blog_status === "scheduled");
  // ISO dates (YYYY-MM-DD) sort correctly as strings — no need to parse to compare.
  const lastDate = scheduled.reduce<string | null>(
    (max, d) => (max === null || d.data > max ? d.data : max),
    null,
  );
  const daysAhead = lastDate ? dayjs(lastDate).diff(dayjs().startOf("day"), "day") : null;
  const tone = runwayTone(daysAhead);

  return (
    <DataCard className="flex items-center gap-8">
      <div>
        <p className="text-xs font-semibold text-text-muted m-0">AGENDADOS</p>
        <p className="text-2xl font-semibold m-0" style={{ color: tone }}>
          {scheduled.length}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-muted m-0">COBERTURA</p>
        <p className="text-sm m-0 mt-1" style={{ color: tone }}>
          {lastDate
            ? `até ${dayjs(lastDate).format("DD/MM")} · faltam ${daysAhead} dia${daysAhead === 1 ? "" : "s"}`
            : "sem devocional agendado"}
        </p>
      </div>
    </DataCard>
  );
}
