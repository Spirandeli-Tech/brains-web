import type { IdeaStatus, VideoStatus } from "@/lib/clients/content";

/** The pipeline, in order. Colour walks cold → warm → done so the table reads as
 * progress at a glance, and answers the real question when a channel stalls:
 * where did I get stuck? */
export const VIDEO_STATUSES: VideoStatus[] = [
  "idea",
  "script_ready",
  "recorded",
  "edited",
  "published",
];

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  idea: "Idea",
  script_ready: "Script ready",
  recorded: "Recorded",
  edited: "Edited",
  published: "Published",
};

export const VIDEO_STATUS_COLOR: Record<VideoStatus, string> = {
  idea: "default",
  script_ready: "blue",
  recorded: "orange",
  edited: "purple",
  published: "green",
};

export const IDEA_STATUSES: IdeaStatus[] = ["idea", "review", "promoted", "discarded"];

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: "Idea",
  review: "Needs review",
  promoted: "Promoted",
  discarded: "Discarded",
};

export const IDEA_STATUS_COLOR: Record<IdeaStatus, string> = {
  idea: "blue",
  // Amber, not red: `review` means the fact-check left something pending, which
  // is a warning to resolve, not a failure.
  review: "gold",
  promoted: "green",
  discarded: "default",
};

export const FORMAT_LABEL: Record<string, string> = {
  short: "Short",
  video: "Video",
  message: "Message",
  series: "Series",
};

export const IDEA_TYPES = [
  "reflexao",
  "ensino",
  "devocional",
  "testemunho",
  "lista",
  "historia-biblica",
];

export const IDEA_TYPE_LABEL: Record<string, string> = {
  reflexao: "Reflexão",
  ensino: "Ensino",
  devocional: "Devocional",
  testemunho: "Testemunho",
  lista: "Lista/Prático",
  "historia-biblica": "História bíblica",
};

export const PRIORITIES = ["alta", "media", "baixa"];

export const PRIORITY_LABEL: Record<string, string> = {
  alta: "High",
  media: "Medium",
  baixa: "Low",
};

export const PRIORITY_COLOR: Record<string, string> = {
  alta: "red",
  media: "blue",
  baixa: "default",
};

/** Labels for the 3-question theme gate stored in `Idea.theme_filter`. */
export const THEME_FILTER_LABEL: Record<string, string> = {
  demand: "#9 Demand",
  angle: "#10 Angle",
  immediate_value: "#11 Immediate value",
};
