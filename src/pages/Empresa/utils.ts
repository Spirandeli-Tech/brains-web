import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const EMPRESA_POLL_INTERVAL_MS = 8000;

/** Slug reservado do investidor (Lucas) — não é um agente, mas aparece no feed. */
export const INVESTOR_SLUG = "investidor";

/** Cor do avatar por área do agente. */
const AREA_AVATAR_CLASS: Record<string, string> = {
  executivo: "bg-amber-500",
  tecnologia: "bg-blue-500",
  financeiro: "bg-green-500",
  marketing: "bg-pink-500",
  transversal: "bg-violet-500",
};

/** O investidor tem cor própria: dourado. */
export const INVESTOR_AVATAR_CLASS = "bg-yellow-500";

export function avatarClassForArea(area: string | null | undefined): string {
  if (!area) return "bg-gray-400";
  return AREA_AVATAR_CLASS[area] ?? "bg-gray-400";
}

/** API datetimes são UTC naive — parseia como UTC antes de comparar com agora. */
export function relative(iso: string | null): string {
  if (!iso) return "—";
  return dayjs.utc(iso).local().locale("pt-br").fromNow();
}

export function formatUsd(value: number | null | undefined): string {
  if (value == null) return "—";
  return `US$ ${value.toFixed(2)}`;
}
