import { createAdminClient } from "@/lib/supabase/admin";

const titles = {
  vitality: ["Fitness", "Energético", "Vigoroso", "Resiliente", "Robusto", "Vital"],
  inteligence: ["Sagaz", "Erudito", "Perspicaz", "Astuto", "Sábio", "Iluminado"],
  agility: ["Velocista", "Ágil", "Rápido", "Ligeiro", "Flexível", "Destro"],
  strength: ["Musculoso", "Poderoso", "Forte", "Robusto", "Vigoroso", "Potente"],
};

async function handleGiveTitle(id, total, maxKey, maxValue) {
  let titleIndex = Math.floor(maxValue / 100) - 1;
  titleIndex =
    titleIndex >= titles[maxKey].length ? titles[maxKey].length - 1 : titleIndex;
  const sub_title = titles[maxKey][titleIndex];

  let title;
  if (total <= 199) title = `Lêmure ${sub_title}`;
  else if (total <= 499) title = `Gibão ${sub_title}`;
  else if (total <= 999) title = `Orangotango ${sub_title}`;
  else if (total <= 2999) title = `Gorila ${sub_title}`;
  else if (total <= 4999) title = `Chimpanzé ${sub_title}`;
  else title = `Humano ${sub_title}`;

  const supabase = createAdminClient();
  await supabase.from("champions").update({ title }).eq("id", id);
}

export async function handleUpdateExpBoost(id, wis, daystreak) {
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("champions")
    .select("daystreak, xpBoost")
    .eq("id", id)
    .single();

  const actualDaystreak = daystreak ?? user.daystreak;
  let xpBoostWis = wis / 15;
  let xpBoost = 0;

  if (actualDaystreak >= 7) {
    xpBoost = Math.floor(actualDaystreak / 7) * 3;
    xpBoost = xpBoost > 15 ? 15 : xpBoost;
  }

  xpBoost += xpBoostWis;
  await supabase.from("champions").update({ xpBoost }).eq("id", id);
}

const createStatObject = (name, newValue, oldValue) => ({
  name,
  newValue,
  oldValue,
});

async function statsCalculate(agi, str, int, vit, id) {
  const { upper, absNew, lower } = str.newValue;
  const { run, rope, bike } = agi.newValue;
  const { stu, medit, read } = int.newValue;
  const { meal, drink, sleep } = vit.newValue;

  const stats = {
    strength: Math.floor(upper + absNew + lower),
    agility: Math.floor(run + rope + bike),
    inteligence: Math.floor(stu + medit + read),
    vitality: Math.floor(meal + drink + sleep),
  };

  const total = Object.values(stats).reduce((prev, curr) => prev + curr, 0);
  const wisUpdate = Math.floor(total / 15);

  await handleUpdateExpBoost(id, wisUpdate);
  stats.wisdom = wisUpdate;

  const maxKey = Object.entries(stats).reduce((acc, curr) =>
    acc[1] > curr[1] ? acc : curr
  )[0];
  const maxKeyValue = stats[maxKey];

  await handleGiveTitle(id, total, maxKey, maxKeyValue);
  return stats;
}

export async function statsRefactor(activities, actualStats, id) {
  const row = Array.isArray(actualStats) ? actualStats[0] : actualStats;
  const { strength, agility, inteligence, vitality } = row;

  const {
    kmRun,
    jumpRope,
    kmBike,
    upperLimb,
    abs,
    lowerLimb,
    meals,
    drinks,
    sleep,
    study,
    meditation,
    reading,
  } = activities;

  const agi = createStatObject(
    "agility",
    { run: kmRun / 5, rope: jumpRope / 1800, bike: kmBike / 20 },
    agility
  );
  const str = createStatObject(
    "strength",
    { upper: upperLimb / 300, absNew: abs / 500, lower: lowerLimb / 300 },
    strength
  );
  const int = createStatObject(
    "inteligence",
    { stu: study / 5, medit: meditation / 1, read: reading / 3 },
    inteligence
  );
  const vit = createStatObject(
    "vitality",
    { meal: meals / 8, drink: drinks / 10, sleep: sleep / 240 },
    vitality
  );

  return statsCalculate(agi, str, int, vit, id);
}
