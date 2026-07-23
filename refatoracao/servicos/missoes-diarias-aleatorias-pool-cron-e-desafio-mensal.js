import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLevel } from "@/lib/helpers/calculateLevel";
import { getChampionById } from "@/lib/services/champions";

const LEVEL_FACTOR = 35;

const DAILY_QUEST_POOL = [
  { questName: "Correr 750 metros", questGoal: 0.75, questReward: { tobiasCoins: 175, xp: 200 }, link: "kmRun" },
  { questName: "Pedalar 3 km", questGoal: 3, questReward: { tobiasCoins: 175, xp: 200 }, link: "kmBike" },
  { questName: "Fazer 500 saltos de corda", questGoal: 500, questReward: { tobiasCoins: 175, xp: 200 }, link: "jumpRope" },
  { questName: "Fazer 60 repetições de treino superior", questGoal: 60, questReward: { tobiasCoins: 175, xp: 200 }, link: "upperLimb" },
  { questName: "Fazer 60 repetições de treino abdominal", questGoal: 60, questReward: { tobiasCoins: 175, xp: 200 }, link: "abs" },
  { questName: "Fazer 60 repetições de treino inferior", questGoal: 60, questReward: { tobiasCoins: 175, xp: 200 }, link: "lowerLimb" },
  { questName: "Estudar por 30 minutos", questGoal: 0.5, questReward: { tobiasCoins: 175, xp: 200 }, link: "study" },
  { questName: "Meditar por 5 minutos", questGoal: 0.08, questReward: { tobiasCoins: 175, xp: 200 }, link: "meditation" },
  { questName: "Ler por 15 minutos", questGoal: 0.25, questReward: { tobiasCoins: 175, xp: 200 }, link: "reading" },
  { questName: "Beber 2 litros de água", questGoal: 2, questReward: { tobiasCoins: 175, xp: 200 }, link: "drinks" },
  { questName: "Fazer 3 refeições saudáveis", questGoal: 3, questReward: { tobiasCoins: 175, xp: 200 }, link: "meals" },
];

async function updateQuestReward(championId, quest, addValue) {
  const questActual = quest.questActual + parseFloat(addValue);
  const patch = { questActual };

  if (questActual >= quest.questGoal) {
    const champion = await getChampionById(championId);
    const rewards =
      typeof quest.questReward === "string"
        ? JSON.parse(quest.questReward)
        : quest.questReward;

    const xpBoost = rewards.xp * (champion.xpBoost / 100);
    const updatedXp =
      parseFloat(champion.xp) + parseFloat(rewards.xp) + parseFloat(xpBoost);

    await createAdminClient()
      .from("champions")
      .update({
        level: calculateLevel(updatedXp, LEVEL_FACTOR),
        xp: updatedXp,
        tobiasCoins: (champion.tobiasCoins || 0) + rewards.tobiasCoins,
      })
      .eq("id", championId);

    patch.completed = true;
    patch.completedDate = new Date().toISOString().slice(0, 10);
  }

  await createAdminClient()
    .from("quests")
    .update(patch)
    .eq("id", quest.id);
}

export async function updateQuestByLink(championId, stats, value) {
  const supabase = createAdminClient();
  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .eq("champion_id", championId)
    .eq("link", stats)
    .eq("completed", false);

  for (const quest of quests || []) {
    await updateQuestReward(championId, quest, value);
  }
}

export async function updateMonthlyChallengeByLink(championId, stats, value) {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("monthlychallenge")
    .select("*")
    .eq("champion_id", championId)
    .eq("link", stats)
    .maybeSingle();

  if (!row || row.completed) return;

  const questActual = row.questActual + parseFloat(value);
  const patch = { questActual };

  if (questActual >= row.questGoal) {
    patch.completed = true;
    const rewards =
      typeof row.questReward === "string"
        ? JSON.parse(row.questReward)
        : row.questReward;
    const champion = await getChampionById(championId);
    const xpBoost = rewards.xp * (champion.xpBoost / 100);
    const updatedXp =
      parseFloat(champion.xp) + parseFloat(rewards.xp) + parseFloat(xpBoost);

    await supabase
      .from("champions")
      .update({
        level: calculateLevel(updatedXp, LEVEL_FACTOR),
        xp: updatedXp,
        tobiasCoins: (champion.tobiasCoins || 0) + rewards.tobiasCoins,
      })
      .eq("id", championId);
  }

  await supabase.from("monthlychallenge").update(patch).eq("id", row.id);
}

export async function regenerateDailyQuest(updateData) {
  const supabase = createAdminClient();
  const champion = await getChampionById(updateData.championId);

  const today = new Date().setHours(0, 0, 0, 0);
  const lastFree = champion.lastFreeQuestUpdate
    ? new Date(champion.lastFreeQuestUpdate).setHours(0, 0, 0, 0)
    : null;
  const isFree = !lastFree || lastFree < today;

  if (!isFree && !(updateData.price > 0 && champion.tobiasCoins >= updateData.price)) {
    return updateData.price > 0 ? false : "Preço inválido.";
  }

  if (!isFree) {
    await supabase
      .from("champions")
      .update({ tobiasCoins: champion.tobiasCoins - updateData.price })
      .eq("id", updateData.championId);
  } else {
    await supabase
      .from("champions")
      .update({ lastFreeQuestUpdate: new Date().toISOString() })
      .eq("id", updateData.championId);
  }

  await supabase.from("quests").delete().eq("id", updateData.questId);

  const { data: active } = await supabase
    .from("quests")
    .select("questName")
    .eq("champion_id", updateData.championId)
    .eq("completed", false);

  const names = new Set((active || []).map((q) => q.questName));
  names.add(updateData.questName);

  const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5);
  const newQuest = shuffled.find((q) => !names.has(q.questName));

  if (!newQuest) return "Não foi possível encontrar uma nova quest válida.";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await supabase.from("quests").insert({
    champion_id: updateData.championId,
    questName: newQuest.questName,
    questGoal: newQuest.questGoal,
    questActual: 0,
    questLimitDate: tomorrow.toISOString().slice(0, 10),
    questReward: newQuest.questReward,
    completed: false,
    link: newQuest.link,
  });

  return true;
}

export async function runDailyQuestsCron() {
  const supabase = createAdminClient();
  await supabase.from("quests").delete().eq("completed", false);

  const { data: champions } = await supabase.from("champions").select("id");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const { id } of champions || []) {
    const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5);
    const picked = [];
    for (const q of shuffled) {
      if (picked.length >= 3) break;
      if (!picked.find((p) => p.questName === q.questName)) picked.push(q);
    }
    for (const q of picked) {
      await supabase.from("quests").insert({
        champion_id: id,
        questName: q.questName,
        questGoal: q.questGoal,
        questActual: 0,
        questLimitDate: tomorrow.toISOString().slice(0, 10),
        questReward: q.questReward,
        completed: false,
        link: q.link,
      });
    }
  }
}
