"use server";

import { loginChampion } from "@/lib/services/auth";
import { getChampionByIdFull, updateChampionBiography, updateChampionDaystreak, getAllChampionsMonthlyChallenge } from "@/lib/services/champions";
import { updateActivityFlow } from "@/lib/services/activities";
import { getCalendarByChampionId, createEvent, deleteEvent, countEventDateByWeekDayAndColor } from "@/lib/services/calendar";
import { createGoal, updateGoal, deleteGoal } from "@/lib/services/goals";
import { getAllAchievements } from "@/lib/services/achievements";
import { buyDaystreakShield } from "@/lib/services/items";
import { getRandomQuote } from "@/lib/services/quotes";
import { regenerateDailyQuest } from "@/lib/services/quests";
import { getStatsDetailsById } from "@/lib/services/statsDetails";
import { getDailyActivitiesById } from "@/lib/services/activities";
import { getAllFiles } from "@/lib/services/files";
import { requireChampionSession } from "@/lib/auth/session";

export async function doLogin(username, password) {
  const result = await loginChampion(username, password);
  if (!result) return { isValid: false };
  return { isValid: true, champion: result.champion, token: result.token };
}

export async function getChampionDataById(id) {
  const session = await requireChampionSession();
  const championId = Number(id ?? session.user.champion_id);
  if (!championId || Number.isNaN(championId)) {
    throw new Error("ID do campeão inválido");
  }
  return getChampionByIdFull(championId);
}

export async function getQuote() {
  const quote = await getRandomQuote();
  return { quote };
}

export async function getCalendarById(id) {
  const cal = await getCalendarByChampionId(id);
  if (cal?.events) {
    cal.events = cal.events.map((ev) => ({
      ...ev,
      backgroundColor: ev.background_color,
    }));
  }
  return { calendars: cal };
}

export async function getChampionsImages() {
  return getAllFiles();
}

export async function updateActivitie(activitieData) {
  const session = await requireChampionSession();
  const { championId, selectedActivitie, activitieIntensity, activitieValue } =
    activitieData;

  if (session.user.champion_id !== championId) {
    throw new Error("Acesso negado");
  }

  const result = await updateActivityFlow(championId, {
    [selectedActivitie]: activitieValue,
    activitieIntensity,
  });

  return result;
}

export async function addEvent(event, calendarId) {
  await requireChampionSession();
  return createEvent(calendarId, event);
}

export async function removeEvent(eventDate, calendarId) {
  await requireChampionSession();
  return deleteEvent(calendarId, eventDate);
}

export async function createGoalAction(goalData) {
  await requireChampionSession();
  return createGoal(goalData);
}

export async function updateGoalAction(id, goalData) {
  await requireChampionSession();
  return updateGoal(id, goalData);
}

export async function deleteGoalAction(id) {
  await requireChampionSession();
  return deleteGoal(id);
}

export async function getAchievements() {
  return getAllAchievements();
}

export async function buyItem(buyData) {
  const session = await requireChampionSession();
  if (session.user.champion_id !== buyData.id) throw new Error("Acesso negado");
  return buyDaystreakShield(buyData);
}

export async function updateChampionBio(id, bio) {
  const session = await requireChampionSession();
  if (session.user.champion_id !== id) throw new Error("Acesso negado");
  return updateChampionBiography(id, bio);
}

export async function updateDaystreak(id) {
  const session = await requireChampionSession();
  if (session.user.champion_id !== id) throw new Error("Acesso negado");
  return updateChampionDaystreak(id);
}

export async function regenerateDailyQuestAction(updateData) {
  await requireChampionSession();
  return regenerateDailyQuest(updateData);
}

export async function getAllChampionsMonthlyChallengeAction() {
  const data = await getAllChampionsMonthlyChallenge();
  return { champions: data ?? [] };
}

export async function getStatsDetailsByIdAction(id) {
  return getStatsDetailsById(id);
}

export async function getEventCountByDate(id) {
  const events = await countEventDateByWeekDayAndColor(id);
  return { events: events ?? {} };
}

export async function getDailyActivitieById(id) {
  const data = await getDailyActivitiesById(id);
  return { activities: Array.isArray(data) ? data : [] };
}
