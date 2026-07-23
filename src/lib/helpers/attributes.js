/** Atributos clássicos + título dinâmico (Cap. 9). Sem xpBoost. */

export const PRIMARY_STATS = [
  "strength",
  "agility",
  "inteligence",
  "vitality",
];

export const STAT_LABELS = {
  strength: "Força",
  agility: "Agilidade",
  inteligence: "Inteligência",
  vitality: "Vitalidade",
  wisdom: "Sabedoria",
};

export const STAT_SHORT = {
  strength: "FOR",
  agility: "AGI",
  inteligence: "INT",
  vitality: "VIT",
  wisdom: "SAB",
};

const TITLE_SUBS = {
  vitality: ["Fitness", "Energético", "Vigoroso", "Resiliente", "Robusto", "Vital"],
  inteligence: ["Sagaz", "Erudito", "Perspicaz", "Astuto", "Sábio", "Iluminado"],
  agility: ["Velocista", "Ágil", "Rápido", "Ligeiro", "Flexível", "Destro"],
  strength: ["Musculoso", "Poderoso", "Forte", "Robusto", "Vigoroso", "Potente"],
};

export function recalcWisdom(stats) {
  const total =
    Number(stats.strength || 0) +
    Number(stats.agility || 0) +
    Number(stats.inteligence || 0) +
    Number(stats.vitality || 0);
  return Math.floor(total / 15);
}

export function grantPrimaryStat(stats, key, amount) {
  if (!PRIMARY_STATS.includes(key)) {
    throw new Error(`primary_stat inválido: ${key}`);
  }
  const next = {
    strength: Number(stats.strength || 0),
    agility: Number(stats.agility || 0),
    inteligence: Number(stats.inteligence || 0),
    vitality: Number(stats.vitality || 0),
  };
  next[key] = next[key] + Math.max(0, Number(amount) || 0);
  next.wisdom = recalcWisdom(next);
  return next;
}

export function attrGrantForStep(plannedMinutes, missionCompleted) {
  const base = Math.max(1, Math.floor((Number(plannedMinutes) || 10) / 10));
  return base + (missionCompleted ? 2 : 0);
}

export function pickDominantTitle(stats) {
  const core = {
    strength: Number(stats.strength || 0),
    agility: Number(stats.agility || 0),
    inteligence: Number(stats.inteligence || 0),
    vitality: Number(stats.vitality || 0),
  };
  const total = Object.values(core).reduce((a, b) => a + b, 0);
  const [maxKey, maxValue] = Object.entries(core).reduce((acc, curr) =>
    curr[1] > acc[1] ? curr : acc
  );

  let titleIndex = Math.floor(maxValue / 100) - 1;
  if (titleIndex < 0) titleIndex = 0;
  const subs = TITLE_SUBS[maxKey] || TITLE_SUBS.inteligence;
  if (titleIndex >= subs.length) titleIndex = subs.length - 1;
  const sub = subs[titleIndex];

  let prefix;
  if (total <= 199) prefix = "Lêmure";
  else if (total <= 499) prefix = "Gibão";
  else if (total <= 999) prefix = "Orangotango";
  else if (total <= 2999) prefix = "Gorila";
  else if (total <= 4999) prefix = "Chimpanzé";
  else prefix = "Humano";

  return `${prefix} ${sub}`;
}

export function normalizePrimaryStat(value) {
  if (PRIMARY_STATS.includes(value)) return value;
  return "inteligence";
}
