"use server";

import { loginChampion, registerChampion } from "@/lib/services/auth";
import {
  getChampionByIdFull,
  updateChampionBiography,
  getMyProfile,
  updateProfileVisibility,
  getPublicProfileCard,
  listPublicChampions,
  setChampionPins,
} from "@/lib/services/champions";
import { getSessionAnalytics } from "@/lib/services/analytics";
import { getAllFiles } from "@/lib/services/files";
import { requireChampionSession } from "@/lib/auth/session";
import { generateMyInvite, getMyInvite } from "@/lib/services/invites";
import {
  getContinueState,
  setActiveMission,
  startSession,
  finishSession,
  completeStep,
  pauseMission,
  ensureDemoCampaigns,
  focusCampaign,
  listCampaignsDetailed,
  ensureFinanceCampaign,
  createCampaignWithMission,
  getCampaignEditor,
  updateCampaignEditor,
  addChapter,
  addMission,
  archiveCampaign,
  restoreCampaign,
} from "@/lib/services/campaigns";

export async function doLogin(username, password) {
  const result = await loginChampion(username, password);
  if (!result) return { isValid: false };
  return { isValid: true, champion: result.champion, token: result.token };
}

export async function actionRegisterChampion(payload) {
  try {
    const result = await registerChampion(payload || {});
    return { ok: true, ...result };
  } catch (err) {
    return {
      ok: false,
      message: err?.message || "Não foi possível criar a conta",
    };
  }
}

export async function getChampionDataById(id) {
  const session = await requireChampionSession();
  const championId = Number(id ?? session.user.champion_id);
  if (!championId || Number.isNaN(championId)) {
    throw new Error("ID do campeão inválido");
  }
  return getChampionByIdFull(championId);
}

export async function updateChampionBio(id, bio) {
  const session = await requireChampionSession();
  if (Number(session.user.champion_id) !== Number(id)) {
    throw new Error("Acesso negado");
  }
  return updateChampionBiography(id, bio);
}

export async function getChampionsImages() {
  await requireChampionSession();
  return getAllFiles();
}

export async function fetchContinueState() {
  const session = await requireChampionSession();
  return getContinueState(session.user.champion_id);
}

export async function fetchCampaigns() {
  const session = await requireChampionSession();
  const state = await getContinueState(session.user.champion_id);
  return state.campaigns || [];
}

export async function actionEnsureDemoCampaigns() {
  const session = await requireChampionSession();
  return ensureDemoCampaigns(session.user.champion_id);
}

export async function actionSetActiveMission(missionId) {
  const session = await requireChampionSession();
  return setActiveMission(session.user.champion_id, Number(missionId));
}

export async function actionStartSession(stepId, plannedMinutes) {
  const session = await requireChampionSession();
  return startSession(
    session.user.champion_id,
    Number(stepId),
    plannedMinutes
  );
}

export async function actionFinishSession(sessionId, elapsedSeconds, status) {
  const session = await requireChampionSession();
  return finishSession(session.user.champion_id, Number(sessionId), {
    elapsedSeconds,
    status: status || "completed",
  });
}

export async function actionCompleteStep(stepId, elapsedSeconds, sessionId) {
  const session = await requireChampionSession();
  return completeStep(session.user.champion_id, Number(stepId), {
    elapsedSeconds: elapsedSeconds || 0,
    sessionId: sessionId ? Number(sessionId) : null,
  });
}

export async function actionPauseMission(missionId, resumeNote) {
  const session = await requireChampionSession();
  return pauseMission(
    session.user.champion_id,
    Number(missionId),
    resumeNote || ""
  );
}

export async function actionFocusCampaign(campaignId) {
  const session = await requireChampionSession();
  return focusCampaign(session.user.champion_id, Number(campaignId));
}

export async function actionResumeMission(missionId) {
  const session = await requireChampionSession();
  return setActiveMission(session.user.champion_id, Number(missionId));
}

export async function fetchCampaignsDetailed(scope = "active") {
  const session = await requireChampionSession();
  return listCampaignsDetailed(session.user.champion_id, {
    scope: scope === "archived" ? "archived" : "active",
  });
}

export async function actionEnsureFinanceCampaign() {
  const session = await requireChampionSession();
  const result = await ensureFinanceCampaign(session.user.champion_id);
  const items = await listCampaignsDetailed(session.user.champion_id);
  return { ...result, items };
}

export async function actionCreateCampaign(payload) {
  const session = await requireChampionSession();
  return createCampaignWithMission(session.user.champion_id, payload);
}

export async function fetchCampaignEditor(campaignId, missionId = null) {
  const session = await requireChampionSession();
  return getCampaignEditor(
    session.user.champion_id,
    Number(campaignId),
    missionId != null ? Number(missionId) : null
  );
}

export async function actionUpdateCampaignEditor(campaignId, payload) {
  const session = await requireChampionSession();
  return updateCampaignEditor(
    session.user.champion_id,
    Number(campaignId),
    payload
  );
}

export async function actionAddChapter(campaignId, payload) {
  const session = await requireChampionSession();
  return addChapter(session.user.champion_id, Number(campaignId), payload);
}

export async function actionAddMission(chapterId, payload) {
  const session = await requireChampionSession();
  return addMission(session.user.champion_id, Number(chapterId), payload);
}

export async function actionArchiveCampaign(campaignId) {
  const session = await requireChampionSession();
  return archiveCampaign(session.user.champion_id, Number(campaignId));
}

export async function actionRestoreCampaign(campaignId) {
  const session = await requireChampionSession();
  return restoreCampaign(session.user.champion_id, Number(campaignId));
}

/* —— Identity & Mundo (Caps 9–13) —— */

export async function fetchMyProfile() {
  const session = await requireChampionSession();
  return getMyProfile(session.user.champion_id);
}

export async function actionUpdateChampionBio(championId, bio) {
  const session = await requireChampionSession();
  if (Number(session.user.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado");
  }
  await updateChampionBiography(championId, bio);
  return getMyProfile(championId);
}

export async function actionUpdateProfileVisibility(visibility) {
  const session = await requireChampionSession();
  return updateProfileVisibility(session.user.champion_id, visibility);
}

export async function fetchPublicProfile(championId) {
  await requireChampionSession();
  return getPublicProfileCard(Number(championId));
}

export async function fetchPublicChampions() {
  await requireChampionSession();
  return listPublicChampions();
}

export async function fetchSessionAnalytics({
  days = 90,
  campaignId = null,
} = {}) {
  const session = await requireChampionSession();
  return getSessionAnalytics(session.user.champion_id, {
    days,
    campaignId: campaignId ? Number(campaignId) : null,
  });
}

export async function actionSetChampionPins(achievementIds) {
  const session = await requireChampionSession();
  return setChampionPins(session.user.champion_id, achievementIds);
}

export async function fetchMyInvite() {
  const session = await requireChampionSession();
  return getMyInvite(session.user.champion_id);
}

export async function actionGenerateMyInvite() {
  try {
    const session = await requireChampionSession();
    const invite = await generateMyInvite(session.user.champion_id);
    return { ok: true, invite };
  } catch (err) {
    return {
      ok: false,
      message: err?.message || "Não foi possível gerar o convite",
    };
  }
}
