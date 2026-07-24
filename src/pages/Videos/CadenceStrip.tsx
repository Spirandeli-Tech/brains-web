import { useCallback, useEffect, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import dayjs from "dayjs";
import contentClient from "@/lib/clients/content";
import type { CadenceWeek } from "@/lib/clients/content";
import { CADENCE_STATE_COLOR, FORMAT_LABEL } from "./constants";

const WEEKS = 6;

/** Ordered the way the plan reads: the episode is the product, the rest derives. */
const SLOTS = ["episode", "short", "podcast"] as const;

function Slot({ filled, target, label }: { filled: number; target: number; label: string }) {
  // One pip per planned unit, so a gap is countable at a glance rather than
  // something you have to read off a number.
  const pips = Array.from({ length: Math.max(target, filled) }, (_, i) => i < filled);
  return (
    <Tooltip title={`${label}: ${filled} of ${target} planned`}>
      <div className="flex items-center gap-1">
        {pips.map((isFilled, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full ${
              isFilled ? "bg-current" : "bg-transparent border border-current opacity-40"
            }`}
          />
        ))}
      </div>
    </Tooltip>
  );
}

export function CadenceStrip({ refreshKey }: { refreshKey?: number }) {
  const [weeks, setWeeks] = useState<CadenceWeek[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setWeeks(await contentClient.getCadence(WEEKS));
    } catch {
      // A failed strip must not take the calendar down with it — the table below
      // is the thing you came for.
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) return <Skeleton.Node active className="!w-full !h-24" />;
  if (!weeks.length) return null;

  const gaps = weeks.reduce(
    (sum, week) => sum + Object.values(week.missing).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="bg-white rounded-lg border border-border-subtle p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-text-muted m-0">
            NEXT {WEEKS} WEEKS · 1 episode + 2 cuts + 1 podcast per week
          </p>
          <p className="text-[11px] text-text-muted m-0 mt-0.5">
            Cuts go out Tue/Fri, so an episode's cuts land in the following column.
          </p>
        </div>
        {gaps > 0 && (
          <span className="text-xs font-medium" style={{ color: CADENCE_STATE_COLOR.empty }}>
            {gaps} slot{gaps === 1 ? "" : "s"} unfilled
          </span>
        )}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week) => {
          const color = CADENCE_STATE_COLOR[week.state];
          return (
            <div
              key={week.starts_on}
              className={`rounded-lg border p-2.5 flex flex-col gap-2 ${
                week.is_current ? "border-brand-primary bg-bg-selected" : "border-border-subtle"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-text-primary">
                  wk {week.week_number}
                </span>
                <span className="text-[10px] text-text-muted">
                  {dayjs(week.starts_on).format("DD/MM")}
                </span>
              </div>

              <div className="flex flex-col gap-1.5" style={{ color }}>
                {SLOTS.map((slot) => (
                  <Slot
                    key={slot}
                    filled={week.counts[slot] ?? 0}
                    target={week.target[slot] ?? 0}
                    label={FORMAT_LABEL[slot]}
                  />
                ))}
              </div>

              <span className="text-[10px] text-text-muted truncate">
                {week.series.length ? week.series.join(", ") : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
