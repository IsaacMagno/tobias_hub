"use server";

import { loginChampion, registerChampion } from "@/lib/services/auth";
import {
  getChampionByIdFull,
  updateChampionBiography,
  getMyProfile,
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
import { ensureIsaacLifeCampaigns } from "@/lib/services/isaacCampaigns";
import {
  listMyStreaks,
  createStreak,
  updateStreak,
  deleteStreak,
  markStreakDay,
  unmarkStreakDay,
  setStreakCampaigns,
} from "@/lib/services/habitStreaks";
import {
  listSuggestedCampaigns,
  acceptSuggestedCampaign,
} from "@/lib/services/campaignSuggestions";
import {
  createShareCode,
  listShareCodesForCampaign,
  redeemShareCode,
} from "@/lib/services/campaignShares";
import {
  submitCampaignToCommunity,
  getSubmissionForCampaign,
  listPendingSubmissions,
  listApprovedCommunityCampaigns,
  reviewSubmission,
  acceptCommunitySubmission,
  isCommunityModerator,
} from "@/lib/services/communitySubmissions";
import {
  createPlazaPost,
  listPlazaPosts,
  listMyPlazaCampaignOptions,
} from "@/lib/services/plaza";
import {
  listChallenges,
  joinChallenge,
  checkinChallenge,
  getChallengeStats,
} from "@/lib/services/communityChallenges";
import { listMilestoneBanners } from "@/lib/services/communityMilestones";
import {
  createClan,
  joinClanByCode,
  listMyClans,
  clanCheckin,
  listClanProtocolOptions,
} from "@/lib/services/communityClans";

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

/** Seed das 5 frentes de vida (Isaac / quem chamar). Idempotente por título. */
export async function actionEnsureIsaacLifeCampaigns() {
  const session = await requireChampionSession();
  return ensureIsaacLifeCampaigns(session.user.champion_id);
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

/* —— Streaks personalizadas —— */

export async function fetchMyStreaks() {
  const session = await requireChampionSession();
  return listMyStreaks(session.user.champion_id);
}

export async function actionCreateHabitStreak(payload) {
  const session = await requireChampionSession();
  return createStreak(session.user.champion_id, payload || {});
}

export async function actionUpdateHabitStreak(streakId, payload) {
  const session = await requireChampionSession();
  return updateStreak(session.user.champion_id, Number(streakId), payload || {});
}

export async function actionDeleteHabitStreak(streakId) {
  const session = await requireChampionSession();
  return deleteStreak(session.user.champion_id, Number(streakId));
}

export async function actionMarkHabitStreakToday(streakId) {
  const session = await requireChampionSession();
  return markStreakDay(session.user.champion_id, Number(streakId), {
    source: "manual",
  });
}

export async function actionUnmarkHabitStreakToday(streakId) {
  const session = await requireChampionSession();
  return unmarkStreakDay(session.user.champion_id, Number(streakId));
}

export async function actionSetHabitStreakCampaigns(streakId, campaignIds) {
  const session = await requireChampionSession();
  return setStreakCampaigns(
    session.user.champion_id,
    Number(streakId),
    campaignIds || []
  );
}

/* —— Sugestões de campanha (catálogo oficial) —— */

export async function fetchSuggestedCampaigns() {
  const session = await requireChampionSession();
  return listSuggestedCampaigns(session.user.champion_id);
}

export async function actionAcceptSuggestedCampaign(templateId) {
  const session = await requireChampionSession();
  return acceptSuggestedCampaign(session.user.champion_id, String(templateId));
}

/* —— Compartilhar campanha por código —— */

export async function actionCreateCampaignShareCode(campaignId) {
  const session = await requireChampionSession();
  return createShareCode(session.user.champion_id, Number(campaignId));
}

export async function fetchCampaignShareCodes(campaignId) {
  const session = await requireChampionSession();
  return listShareCodesForCampaign(
    session.user.champion_id,
    Number(campaignId)
  );
}

export async function actionRedeemCampaignShareCode(code) {
  const session = await requireChampionSession();
  return redeemShareCode(session.user.champion_id, code);
}

/* —— Publicação na Comunidade —— */

export async function actionSubmitCampaignToCommunity(campaignId, blurb) {
  const session = await requireChampionSession();
  return submitCampaignToCommunity(
    session.user.champion_id,
    Number(campaignId),
    blurb
  );
}

export async function fetchCampaignCommunitySubmission(campaignId) {
  const session = await requireChampionSession();
  return getSubmissionForCampaign(
    session.user.champion_id,
    Number(campaignId)
  );
}

export async function fetchPendingCommunitySubmissions() {
  const session = await requireChampionSession();
  return listPendingSubmissions(session.user.champion_id);
}

export async function fetchApprovedCommunityCampaigns() {
  const session = await requireChampionSession();
  return listApprovedCommunityCampaigns(session.user.champion_id);
}

export async function actionReviewCommunitySubmission(
  submissionId,
  decision,
  note
) {
  const session = await requireChampionSession();
  return reviewSubmission(
    session.user.champion_id,
    Number(submissionId),
    decision,
    note
  );
}

export async function actionAcceptCommunitySubmission(submissionId) {
  const session = await requireChampionSession();
  return acceptCommunitySubmission(
    session.user.champion_id,
    Number(submissionId)
  );
}

export async function fetchAmICommunityModerator() {
  const session = await requireChampionSession();
  return { isModerator: isCommunityModerator(session.user.champion_id) };
}

/* —— Praça —— */

export async function actionCreatePlazaPost(body, campaignId) {
  const session = await requireChampionSession();
  return createPlazaPost(session.user.champion_id, {
    body,
    campaignId: campaignId ? Number(campaignId) : null,
  });
}

export async function fetchPlazaPosts(before) {
  await requireChampionSession();
  return listPlazaPosts({ limit: 30, before: before || null });
}

export async function fetchMyPlazaCampaignOptions() {
  const session = await requireChampionSession();
  return listMyPlazaCampaignOptions(session.user.champion_id);
}

/* —— Desafios —— */

export async function fetchCommunityChallenges() {
  const session = await requireChampionSession();
  return listChallenges(session.user.champion_id);
}

export async function actionJoinCommunityChallenge(challengeId) {
  const session = await requireChampionSession();
  return joinChallenge(session.user.champion_id, Number(challengeId));
}

export async function actionCheckinCommunityChallenge(challengeId) {
  const session = await requireChampionSession();
  return checkinChallenge(session.user.champion_id, Number(challengeId));
}

export async function fetchCommunityChallengeStats(challengeId) {
  const session = await requireChampionSession();
  return getChallengeStats(session.user.champion_id, Number(challengeId));
}

/* —— Marcos —— */

export async function fetchCommunityMilestoneBanners() {
  await requireChampionSession();
  return listMilestoneBanners();
}

/* —— Clãs —— */

export async function fetchMyClans() {
  const session = await requireChampionSession();
  return listMyClans(session.user.champion_id);
}

export async function fetchClanProtocolOptions() {
  const session = await requireChampionSession();
  return listClanProtocolOptions(session.user.champion_id);
}

export async function actionCreateClan(name, protocolRef) {
  const session = await requireChampionSession();
  return createClan(session.user.champion_id, { name, protocolRef });
}

export async function actionJoinClanByCode(code) {
  const session = await requireChampionSession();
  return joinClanByCode(session.user.champion_id, code);
}

export async function actionClanCheckin(clanId) {
  const session = await requireChampionSession();
  return clanCheckin(session.user.champion_id, Number(clanId));
}
