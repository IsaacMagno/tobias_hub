import {
  Activity,
  Apple,
  Ban,
  Book,
  Brain,
  Code2,
  Coffee,
  Dumbbell,
  Droplets,
  Flame,
  Heart,
  Moon,
  Music,
  Pencil,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

export const STREAK_ICON_OPTIONS = [
  { id: "target", Icon: Target, label: "Foco" },
  { id: "flame", Icon: Flame, label: "Sequência" },
  { id: "book", Icon: Book, label: "Leitura" },
  { id: "dumbbell", Icon: Dumbbell, label: "Treino" },
  { id: "activity", Icon: Activity, label: "Movimento" },
  { id: "brain", Icon: Brain, label: "Estudo" },
  { id: "code", Icon: Code2, label: "Código" },
  { id: "wallet", Icon: Wallet, label: "Finanças" },
  { id: "apple", Icon: Apple, label: "Alimentação" },
  { id: "ban", Icon: Ban, label: "Evitar" },
  { id: "heart", Icon: Heart, label: "Saúde" },
  { id: "moon", Icon: Moon, label: "Sono" },
  { id: "droplets", Icon: Droplets, label: "Água" },
  { id: "coffee", Icon: Coffee, label: "Café" },
  { id: "music", Icon: Music, label: "Música" },
  { id: "pencil", Icon: Pencil, label: "Escrita" },
  { id: "zap", Icon: Zap, label: "Energia" },
];

export const STREAK_ICON_IDS = new Set(
  STREAK_ICON_OPTIONS.map((o) => o.id)
);

export const DEFAULT_STREAK_ICON = "target";

export function resolveStreakIconId(value) {
  if (!value) return DEFAULT_STREAK_ICON;
  const id = String(value).trim().toLowerCase();
  if (STREAK_ICON_IDS.has(id)) return id;
  return DEFAULT_STREAK_ICON;
}

export function getStreakIconOption(id) {
  const resolved = resolveStreakIconId(id);
  return STREAK_ICON_OPTIONS.find((o) => o.id === resolved);
}
