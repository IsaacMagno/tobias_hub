import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateChampionExp,
  applyStatGrant,
  evaluateAchievements,
} from "@/lib/services/champions";
import {
  attrGrantForStep,
  normalizePrimaryStat,
  STAT_SHORT,
} from "@/lib/helpers/attributes";
import { autoMarkFromCampaign } from "@/lib/services/habitStreaks";

const WEEKDAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

function todayWeekdayKey(timeZone = process.env.TIMEZONE || "America/Sao_Paulo") {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const map = {
    Sun: "dom",
    Mon: "seg",
    Tue: "ter",
    Wed: "qua",
    Thu: "qui",
    Fri: "sex",
    Sat: "sab",
  };
  return map[fmt.format(new Date())] || WEEKDAY_KEYS[new Date().getDay()];
}

function agendaLabel(mission) {
  if (!mission) return null;
  const days = mission.weekdays?.length ? mission.weekdays.join(", ") : null;
  const time = mission.time_of_day || null;
  const mins = mission.planned_minutes
    ? `${mission.planned_minutes} min`
    : null;
  const parts = [days, time, mins].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function isScheduledToday(mission) {
  if (!mission?.weekdays?.length) return true;
  return mission.weekdays.includes(todayWeekdayKey());
}

function normalizeNested(value) {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function buildContinuePayload({ campaign, chapter, mission, steps, runningSession }) {
  const ordered = [...(steps ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  const currentStep =
    ordered.find((s) => s.status === "current") ||
    ordered.find((s) => s.status === "pending") ||
    null;
  const stepsDone = ordered.filter(
    (s) => s.status === "done" || s.status === "skipped"
  ).length;
  const stepsTotal = ordered.length;

  return {
    empty: false,
    campaign,
    chapter,
    mission,
    steps: ordered,
    currentStep,
    stepsDone,
    stepsTotal,
    progressPct: stepsTotal
      ? Math.round((stepsDone / stepsTotal) * 100)
      : 0,
    resumeNote: mission.resume_note || currentStep?.resume_note || null,
    agendaToday: isScheduledToday(mission),
    agendaLabel: agendaLabel(mission),
    weekdayToday: todayWeekdayKey(),
    runningSession: runningSession || null,
  };
}

async function getMissionTree(missionId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("missions")
    .select(
      `
      *,
      campaign_chapters (
        *,
        campaigns (*)
      ),
      mission_steps (*)
    `
    )
    .eq("id", missionId)
    .single();

  if (error) throw error;

  const chapter = normalizeNested(data.campaign_chapters);
  const campaign = normalizeNested(chapter?.campaigns);
  const { campaign_chapters: _c, mission_steps: steps, ...mission } = data;

  return {
    mission,
    chapter: chapter ? { ...chapter, campaigns: undefined } : null,
    campaign,
    steps: steps ?? [],
  };
}

/** Minutos desde meia-noite (TZ do app) a partir de "HH:MM" / "HH:MM:SS". */
function timeOfDayToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

function nowMinutesInTz(timeZone = process.env.TIMEZONE || "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  return hour * 60 + minute;
}

/**
 * Score para escolher missão quando não há foco manual:
 * 1) agenda de hoje (weekdays específicos > “todo dia”)
 * 2) horário mais próximo de agora
 * 3) status / order_index
 */
function scoreMissionForFocus(mission, todayKey, nowMins) {
  const days = Array.isArray(mission.weekdays) ? mission.weekdays : [];
  const hasDays = days.length > 0;
  const scheduledToday = !hasDays || days.includes(todayKey);
  // Específicas (poucos dias) ganham das diárias / sem agenda
  const specificity = hasDays ? Math.max(0, 7 - days.length) : 0;
  const todMins = timeOfDayToMinutes(mission.time_of_day);
  const proximity =
    todMins == null || nowMins == null
      ? 24 * 60
      : Math.min(
          Math.abs(todMins - nowMins),
          24 * 60 - Math.abs(todMins - nowMins)
        );

  const statusRank = { active: 0, paused: 1, in_progress: 2, available: 3 };
  return {
    scheduledToday: scheduledToday ? 0 : 1,
    specificity: -specificity,
    proximity,
    status: statusRank[mission.status] ?? 9,
    order: mission.order_index ?? 0,
  };
}

function compareFocusScores(a, b) {
  return (
    a.scheduledToday - b.scheduledToday ||
    a.specificity - b.specificity ||
    a.proximity - b.proximity ||
    a.status - b.status ||
    a.order - b.order
  );
}

async function pickMissionId(championId) {
  const supabase = createAdminClient();

  const { data: focus } = await supabase
    .from("user_focus")
    .select("active_mission_id")
    .eq("champion_id", championId)
    .maybeSingle();

  if (focus?.active_mission_id) return focus.active_mission_id;

  const { data: rows } = await supabase
    .from("missions")
    .select(
      `
      id,
      status,
      order_index,
      weekdays,
      time_of_day,
      campaign_chapters!inner (
        campaign_id,
        campaigns!inner ( champion_id, status )
      )
    `
    )
    .eq("campaign_chapters.campaigns.champion_id", championId)
    .neq("campaign_chapters.campaigns.status", "archived")
    .in("status", ["active", "paused", "in_progress", "available"]);

  if (!rows?.length) return null;

  const todayKey = todayWeekdayKey();
  const nowMins = nowMinutesInTz();

  const ranked = [...rows].sort((a, b) =>
    compareFocusScores(
      scoreMissionForFocus(a, todayKey, nowMins),
      scoreMissionForFocus(b, todayKey, nowMins)
    )
  );
  return ranked[0].id;
}

export async function getContinueState(championId) {
  const supabase = createAdminClient();

  const [{ data: champion }, missionId] = await Promise.all([
    supabase
      .from("champions")
      .select("id, xp, level")
      .eq("id", championId)
      .maybeSingle(),
    pickMissionId(championId),
  ]);

  const championInfo = champion
    ? { id: champion.id, xp: champion.xp, level: champion.level }
    : null;

  if (!missionId) {
    const campaigns = await listCampaigns(championId);
    return {
      empty: true,
      message: campaigns.length
        ? "Nenhuma missão em foco. Abra Campanhas e escolha uma frente."
        : "Nenhuma campanha ativa. Use “Preparar campanhas demo” para começar.",
      campaigns,
      champion: championInfo,
    };
  }

  const [tree, sessionRes, campaignsRes] = await Promise.all([
    getMissionTree(missionId),
    supabase
      .from("work_sessions")
      .select("id, step_id, status, elapsed_seconds, planned_minutes")
      .eq("champion_id", championId)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, title, status, result, why, created_at")
      .eq("champion_id", championId)
      .neq("status", "archived")
      .order("id", { ascending: true }),
  ]);

  if (Number(tree.campaign?.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado");
  }

  return {
    ...buildContinuePayload({
      campaign: tree.campaign,
      chapter: tree.chapter,
      mission: tree.mission,
      steps: tree.steps,
      runningSession: sessionRes.data || null,
    }),
    campaigns: campaignsRes.data ?? [],
    champion: championInfo,
  };
}

export async function listCampaigns(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, status, result, why, created_at")
    .eq("champion_id", championId)
    .neq("status", "archived")
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Lista campanhas com progresso. scope: "active" | "archived" */
export async function listCampaignsDetailed(
  championId,
  { scope = "active" } = {}
) {
  const supabase = createAdminClient();

  let campaignsQuery = supabase
    .from("campaigns")
    .select(
      `
        id, title, status, result, why, created_at,
        campaign_chapters (
          id, title, status, order_index,
          missions (
            id, title, status, order_index, weekdays,
            mission_steps ( id, status )
          )
        )
      `
    )
    .eq("champion_id", championId)
    .order("id", { ascending: true });

  if (scope === "archived") {
    campaignsQuery = campaignsQuery.eq("status", "archived");
  } else {
    campaignsQuery = campaignsQuery.neq("status", "archived");
  }

  const [{ data: campaigns, error }, { data: focus }] = await Promise.all([
    campaignsQuery,
    supabase
      .from("user_focus")
      .select("active_mission_id")
      .eq("champion_id", championId)
      .maybeSingle(),
  ]);

  if (error) throw error;

  const today = todayWeekdayKey();

  return (campaigns ?? []).map((campaign) => {
    const chapters = [...(campaign.campaign_chapters ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    );
    let stepsTotal = 0;
    let stepsDone = 0;
    let activeMissionTitle = null;
    let focusMissionId = focus?.active_mission_id ?? null;
    let isFocused = false;
    let scheduledToday = false;

    for (const ch of chapters) {
      for (const m of ch.missions ?? []) {
        if (focusMissionId && m.id === focusMissionId) {
          isFocused = true;
          activeMissionTitle = m.title;
        }
        for (const s of m.mission_steps ?? []) {
          stepsTotal += 1;
          if (s.status === "done" || s.status === "skipped") stepsDone += 1;
        }
      }
    }

    const missions = chapters.flatMap((c) => c.missions ?? []);
    if (!activeMissionTitle) {
      const pick =
        missions.find((m) => m.status === "active") ||
        missions.find((m) => m.status === "paused") ||
        missions.find((m) => m.status === "in_progress") ||
        missions.find((m) => m.status === "available") ||
        missions[0];
      activeMissionTitle = pick?.title ?? null;
    }

    const focusable =
      missions.find((m) => focusMissionId && m.id === focusMissionId) ||
      missions.find((m) => m.status === "active") ||
      missions.find((m) => m.status === "paused") ||
      missions.find((m) => m.status === "in_progress") ||
      missions.find((m) => m.status === "available");

    if (focusable) {
      const days = focusable.weekdays ?? [];
      scheduledToday = !days.length || days.includes(today);
    }

    return {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      result: campaign.result,
      why: campaign.why,
      stepsTotal,
      stepsDone,
      progressPct: stepsTotal
        ? Math.round((stepsDone / stepsTotal) * 100)
        : 0,
      activeMissionTitle,
      isFocused,
      scheduledToday,
    };
  });
}

async function assertMissionOwnedByChampion(missionId, championId) {
  const tree = await getMissionTree(missionId);
  if (Number(tree.campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à missão");
  }
  return tree;
}

export async function setActiveMission(championId, missionId) {
  const tree = await assertMissionOwnedByChampion(missionId, championId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: chapterRows } = await supabase
    .from("campaign_chapters")
    .select("id, campaigns!inner(champion_id)")
    .eq("campaigns.champion_id", championId);

  const chapterIds = (chapterRows ?? []).map((c) => c.id);

  const ops = [
    supabase
      .from("missions")
      .update({ status: "active", updated_at: now })
      .eq("id", missionId),
    supabase.from("user_focus").upsert({
      champion_id: championId,
      active_mission_id: missionId,
      updated_at: now,
    }),
  ];

  if (chapterIds.length) {
    ops.unshift(
      supabase
        .from("missions")
        .update({ status: "in_progress", updated_at: now })
        .in("chapter_id", chapterIds)
        .eq("status", "active")
        .neq("id", missionId)
    );
  }

  await Promise.all(ops);
  void tree;
  return getContinueState(championId);
}

export async function focusCampaign(championId, campaignId) {
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, champion_id")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  if (Number(campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à campanha");
  }

  const { data: missions } = await supabase
    .from("missions")
    .select(
      `
      id,
      status,
      order_index,
      campaign_chapters!inner ( campaign_id )
    `
    )
    .eq("campaign_chapters.campaign_id", campaignId)
    .in("status", ["active", "paused", "in_progress", "available"]);

  if (!missions?.length) {
    throw new Error("Nenhuma missão disponível nesta campanha");
  }

  const rank = { active: 0, paused: 1, in_progress: 2, available: 3 };
  missions.sort(
    (a, b) =>
      (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
      a.order_index - b.order_index
  );

  return setActiveMission(championId, missions[0].id);
}

export async function startSession(championId, stepId, plannedMinutes) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Abort + insert em paralelo (abort não precisa bloquear se falhar)
  const [, insertRes] = await Promise.all([
    supabase
      .from("work_sessions")
      .update({ status: "aborted", ended_at: now })
      .eq("champion_id", championId)
      .eq("status", "running"),
    supabase
      .from("work_sessions")
      .insert({
        step_id: stepId,
        champion_id: championId,
        status: "running",
        planned_minutes: plannedMinutes ?? null,
      })
      .select("id, step_id, status, planned_minutes")
      .single(),
  ]);

  if (insertRes.error) throw insertRes.error;
  return insertRes.data;
}

export async function finishSession(
  championId,
  sessionId,
  { elapsedSeconds = 0, status = "completed" } = {}
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("work_sessions")
    .update({
      status,
      elapsed_seconds: elapsedSeconds,
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("champion_id", championId)
    .select("id, status, elapsed_seconds")
    .single();
  if (error) throw error;
  return data;
}

async function unlockDependentMissions(completedMissionId) {
  const supabase = createAdminClient();
  const { data: deps } = await supabase
    .from("mission_dependencies")
    .select("mission_id, allow_skip, requires_mission_id")
    .eq("requires_mission_id", completedMissionId);

  if (!deps?.length) return;

  await Promise.all(
    deps.map(async (dep) => {
      const { data: allDeps } = await supabase
        .from("mission_dependencies")
        .select("requires_mission_id, allow_skip")
        .eq("mission_id", dep.mission_id);

      const requiredIds = (allDeps ?? []).map((d) => d.requires_mission_id);
      if (!requiredIds.length) return;

      const { data: requiredMissions } = await supabase
        .from("missions")
        .select("id, status")
        .in("id", requiredIds);

      const ok = (requiredMissions ?? []).every((m) => {
        const edge = allDeps.find((d) => d.requires_mission_id === m.id);
        return (
          m.status === "completed" ||
          (edge?.allow_skip && m.status === "skipped")
        );
      });

      if (ok) {
        await supabase
          .from("missions")
          .update({
            status: "available",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dep.mission_id)
          .eq("status", "locked");
      }
    })
  );
}

async function maybeCompleteChapter(chapterId) {
  const supabase = createAdminClient();
  const { data: missions } = await supabase
    .from("missions")
    .select("id, status")
    .eq("chapter_id", chapterId);

  const allDone = (missions ?? []).every((m) =>
    ["completed", "skipped"].includes(m.status)
  );
  if (!allDone) return;

  const { data: chapter } = await supabase
    .from("campaign_chapters")
    .select("campaign_id, order_index")
    .eq("id", chapterId)
    .single();

  await supabase
    .from("campaign_chapters")
    .update({ status: "completed" })
    .eq("id", chapterId);

  if (!chapter) return;

  const { data: nextChapter } = await supabase
    .from("campaign_chapters")
    .select("id, status")
    .eq("campaign_id", chapter.campaign_id)
    .eq("order_index", chapter.order_index + 1)
    .maybeSingle();

  if (nextChapter?.status === "locked") {
    await Promise.all([
      supabase
        .from("campaign_chapters")
        .update({ status: "available" })
        .eq("id", nextChapter.id),
      supabase
        .from("missions")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("chapter_id", nextChapter.id)
        .eq("status", "locked")
        .eq("order_index", 0),
    ]);
  }
}

export async function completeStep(
  championId,
  stepId,
  { elapsedSeconds = 0, sessionId = null } = {}
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: step, error } = await supabase
    .from("mission_steps")
    .select("id, mission_id, status, order_index, planned_minutes")
    .eq("id", stepId)
    .single();
  if (error) throw error;

  const tree = await getMissionTree(step.mission_id);
  if (Number(tree.campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado");
  }

  const { data: beforeChamp } = await supabase
    .from("champions")
    .select("xp, level")
    .eq("id", championId)
    .single();

  const stepXp = Math.max(5, Number(step.planned_minutes) || 10);
  let xpGained = stepXp;

  const sessionUpdate = sessionId
    ? supabase
        .from("work_sessions")
        .update({
          status: "completed",
          elapsed_seconds: elapsedSeconds,
          ended_at: now,
        })
        .eq("id", sessionId)
        .eq("champion_id", championId)
    : supabase
        .from("work_sessions")
        .update({
          status: "completed",
          elapsed_seconds: elapsedSeconds,
          ended_at: now,
        })
        .eq("champion_id", championId)
        .eq("step_id", stepId)
        .eq("status", "running");

  await Promise.all([
    sessionUpdate,
    supabase.from("mission_steps").update({ status: "done" }).eq("id", stepId),
  ]);

  if (tree.campaign?.id) {
    try {
      await autoMarkFromCampaign(championId, tree.campaign.id);
    } catch {
      /* streak auto-mark não deve bloquear conclusão do passo */
    }
  }

  const pending = (tree.steps ?? [])
    .filter((s) => s.id !== stepId && s.status === "pending")
    .sort((a, b) => a.order_index - b.order_index);

  const missionCompleted = pending.length === 0;
  if (missionCompleted) {
    xpGained += 25;
  }

  await updateChampionExp(championId, { xp: xpGained });

  const primaryStat = normalizePrimaryStat(tree.campaign?.primary_stat);
  const attrAmount = attrGrantForStep(step.planned_minutes, missionCompleted);
  const attrResult = await applyStatGrant(
    championId,
    primaryStat,
    attrAmount
  );

  const newAchievements = await evaluateAchievements(championId);

  const { data: afterChamp } = await supabase
    .from("champions")
    .select("xp, level, title")
    .eq("id", championId)
    .single();

  const reward = {
    xpGained,
    leveledUp: Number(afterChamp?.level) > Number(beforeChamp?.level),
    level: afterChamp?.level ?? beforeChamp?.level,
    xp: afterChamp?.xp ?? beforeChamp?.xp,
    attrGained: attrResult.attrGained,
    primaryStat: attrResult.primaryStat,
    attrShort: STAT_SHORT[attrResult.primaryStat] || "ATR",
    title: attrResult.title || afterChamp?.title || null,
    newAchievements,
  };

  if (pending.length) {
    await supabase
      .from("mission_steps")
      .update({ status: "current" })
      .eq("id", pending[0].id);

    const steps = (tree.steps ?? []).map((s) => {
      if (s.id === stepId) return { ...s, status: "done" };
      if (s.id === pending[0].id) return { ...s, status: "current" };
      return s;
    });

    const campaigns = await listCampaigns(championId);
    return {
      ...buildContinuePayload({
        campaign: tree.campaign,
        chapter: tree.chapter,
        mission: tree.mission,
        steps,
        runningSession: null,
      }),
      campaigns: (campaigns || []).filter((c) => c.status !== "archived"),
      champion: {
        id: championId,
        xp: reward.xp,
        level: reward.level,
      },
      reward,
    };
  }

  await supabase
    .from("missions")
    .update({
      status: "completed",
      updated_at: now,
      resume_note: null,
    })
    .eq("id", step.mission_id);

  await Promise.all([
    unlockDependentMissions(step.mission_id),
    maybeCompleteChapter(tree.chapter.id),
  ]);

  await supabase.from("user_focus").upsert({
    champion_id: championId,
    active_mission_id: null,
    updated_at: now,
  });

  const nextId = await pickMissionId(championId);
  let nextState;
  if (nextId) {
    nextState = await setActiveMission(championId, nextId);
  } else {
    nextState = await getContinueState(championId);
  }

  return {
    ...nextState,
    champion: {
      id: championId,
      xp: reward.xp,
      level: reward.level,
    },
    reward,
  };
}

export async function pauseMission(championId, missionId, resumeNote = "") {
  const tree = await assertMissionOwnedByChampion(missionId, championId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const note = resumeNote || null;

  const currentStep =
    tree.steps.find((s) => s.status === "current") || null;

  await Promise.all([
    supabase
      .from("work_sessions")
      .update({ status: "aborted", ended_at: now })
      .eq("champion_id", championId)
      .eq("status", "running"),
    supabase
      .from("missions")
      .update({
        status: "paused",
        resume_note: note,
        updated_at: now,
      })
      .eq("id", missionId),
    note && currentStep
      ? supabase
          .from("mission_steps")
          .update({ resume_note: note })
          .eq("id", currentStep.id)
      : Promise.resolve(),
  ]);

  return getContinueState(championId);
}

export async function ensureDemoCampaigns(championId) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("champion_id", championId)
    .limit(1);

  if (existing?.length) {
    return getContinueState(championId);
  }

  const { data: c1, error: e1 } = await supabase
    .from("campaigns")
    .insert({
      champion_id: championId,
      title: "Finalizar o novo Tobias",
      status: "active",
      result:
        "PWA + Continuar + pomodoro + campanhas de vida usáveis no dia a dia",
      why: "Construir o guia antes de espalhar frentes da vida.",
    })
    .select("*")
    .single();
  if (e1) throw e1;

  const { data: ch1 } = await supabase
    .from("campaign_chapters")
    .insert({
      campaign_id: c1.id,
      title: "Cap. 3 — Motor",
      status: "active",
      objective: "Schema e Continuar ligados ao banco",
      order_index: 0,
    })
    .select("*")
    .single();

  const { data: m1 } = await supabase
    .from("missions")
    .insert({
      chapter_id: ch1.id,
      title: "Validar motor Continuar",
      status: "active",
      why: "Confirmar complete/pause/timer no app real.",
      planned_minutes: 30,
      order_index: 0,
    })
    .select("*")
    .single();

  const { data: c2 } = await supabase
    .from("campaigns")
    .insert({
      champion_id: championId,
      title: "Voltar à academia",
      status: "active",
      result: "Ir 2× por semana com treino já definido",
      why: "Saúde sem improvisar na porta da academia.",
    })
    .select("*")
    .single();

  const { data: ch2 } = await supabase
    .from("campaign_chapters")
    .insert({
      campaign_id: c2.id,
      title: "Retomar o hábito (2×/semana)",
      status: "available",
      objective: "Completar a primeira semana de treinos",
      order_index: 0,
    })
    .select("*")
    .single();

  const { data: m2 } = await supabase
    .from("missions")
    .insert({
      chapter_id: ch2.id,
      title: "Primeira semana (2×)",
      status: "available",
      why: "Frequência antes de otimizar carga.",
      weekdays: ["seg", "qui"],
      time_of_day: "18:00",
      planned_minutes: 60,
      order_index: 0,
    })
    .select("*")
    .single();

  await Promise.all([
    supabase.from("mission_steps").insert([
      {
        mission_id: m1.id,
        surface: "Abrir Continuar e iniciar o timer do passo atual",
        detail: "Use o pomodoro; o tempo será gravado ao concluir.",
        planned_minutes: 10,
        status: "current",
        order_index: 0,
      },
      {
        mission_id: m1.id,
        surface: "Concluir este passo e ver o próximo aparecer",
        detail: null,
        planned_minutes: 5,
        status: "pending",
        order_index: 1,
      },
      {
        mission_id: m1.id,
        surface: "Pausar com uma nota de retomada (teste)",
        detail: "Depois retome pela home.",
        planned_minutes: 5,
        status: "pending",
        order_index: 2,
      },
    ]),
    supabase.from("mission_steps").insert([
      {
        mission_id: m2.id,
        surface: "Sair de casa com a sacola pronta",
        detail: "Checklist: tênis, camisa, shorts, toalha, garrafa",
        planned_minutes: 10,
        status: "current",
        order_index: 0,
      },
      {
        mission_id: m2.id,
        surface: "Chegar e aquecer",
        detail: "Esteira/bike 5 min · mobilidade ombro/quadril",
        planned_minutes: 10,
        status: "pending",
        order_index: 1,
      },
      {
        mission_id: m2.id,
        surface: "Bloco A — superiores",
        detail:
          "Supino 3×10 · Remada 3×10 · Desenvolvimento 3×10 · Tríceps 2×12 · Bíceps 2×12",
        planned_minutes: 25,
        status: "pending",
        order_index: 2,
      },
      {
        mission_id: m2.id,
        surface: "Alongar e registrar no Tobias",
        detail: null,
        planned_minutes: 10,
        status: "pending",
        order_index: 3,
      },
    ]),
    supabase.from("user_focus").upsert({
      champion_id: championId,
      active_mission_id: m1.id,
      updated_at: new Date().toISOString(),
    }),
  ]);

  await ensureFinanceCampaign(championId);

  return getContinueState(championId);
}

const FINANCE_TITLE = "Organizar finanças";

/** Idempotente: cria a frente financeira se ainda não existir. */
export async function ensureFinanceCampaign(championId) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("champion_id", championId)
    .eq("title", FINANCE_TITLE)
    .maybeSingle();

  if (existing) {
    return { created: false, campaignId: existing.id };
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      champion_id: championId,
      title: FINANCE_TITLE,
      status: "active",
      result:
        "Saber o que fazer com o dinheiro nas próximas 2 semanas sem planilha infinita",
      why: "Parar de improvisar no fim do mês.",
    })
    .select("*")
    .single();
  if (error) throw error;

  const { data: chapter } = await supabase
    .from("campaign_chapters")
    .insert({
      campaign_id: campaign.id,
      title: "Enxergar o mês",
      status: "active",
      objective: "Uma foto simples da situação e uma regra só",
      order_index: 0,
    })
    .select("*")
    .single();

  const { data: m1 } = await supabase
    .from("missions")
    .insert({
      chapter_id: chapter.id,
      title: "Foto rápida da situação",
      status: "available",
      why: "Ver o dinheiro sem categorizar o universo.",
      planned_minutes: 35,
      order_index: 0,
    })
    .select("*")
    .single();

  const { data: m2 } = await supabase
    .from("missions")
    .insert({
      chapter_id: chapter.id,
      title: "Uma regra simples",
      status: "locked",
      why: "Uma regra basta; o resto é ruído.",
      planned_minutes: 20,
      order_index: 1,
    })
    .select("*")
    .single();

  const { data: m3 } = await supabase
    .from("missions")
    .insert({
      chapter_id: chapter.id,
      title: "Primeira semana com a regra",
      status: "locked",
      why: "Frequência da regra, não perfeição.",
      weekdays: ["seg"],
      time_of_day: "20:00",
      planned_minutes: 20,
      order_index: 2,
    })
    .select("*")
    .single();

  await Promise.all([
    supabase.from("mission_steps").insert([
      {
        mission_id: m1.id,
        surface: "Abrir extrato dos últimos 7 dias",
        detail: "Só ler; não categorizar tudo.",
        planned_minutes: 15,
        status: "current",
        order_index: 0,
      },
      {
        mission_id: m1.id,
        surface: "Anotar 3 gastos que doeram",
        detail: "Nome + valor aproximado.",
        planned_minutes: 10,
        status: "pending",
        order_index: 1,
      },
      {
        mission_id: m1.id,
        surface: "Definir 1 número-alvo da semana",
        detail: 'Ex.: "gastei ≤ X em delivery".',
        planned_minutes: 10,
        status: "pending",
        order_index: 2,
      },
    ]),
    supabase.from("mission_steps").insert([
      {
        mission_id: m2.id,
        surface: "Escolher 1 regra só",
        detail: 'Ex.: "não parcelar por impulso".',
        planned_minutes: 10,
        status: "current",
        order_index: 0,
      },
      {
        mission_id: m2.id,
        surface: "Colocar lembrete no celular no dia do salário",
        detail: "Texto curto com a regra.",
        planned_minutes: 5,
        status: "pending",
        order_index: 1,
      },
      {
        mission_id: m2.id,
        surface: "Registrar no Tobias que a regra existe",
        detail: "Na pausa/retomada, a nota pode ser a própria regra.",
        planned_minutes: 5,
        status: "pending",
        order_index: 2,
      },
    ]),
    supabase.from("mission_steps").insert([
      {
        mission_id: m3.id,
        surface: "Checar a regra da semana",
        detail: "Só sim/não — sem julgamento.",
        planned_minutes: 5,
        status: "current",
        order_index: 0,
      },
      {
        mission_id: m3.id,
        surface: "Anotar se houve desvio",
        detail: "Uma linha: o que rolou.",
        planned_minutes: 8,
        status: "pending",
        order_index: 1,
      },
      {
        mission_id: m3.id,
        surface: "Ajustar 1 coisa se precisar",
        detail: "Trocar o número-alvo ou a regra — nunca os dois.",
        planned_minutes: 7,
        status: "pending",
        order_index: 2,
      },
    ]),
    supabase.from("mission_dependencies").insert([
      { mission_id: m2.id, requires_mission_id: m1.id, allow_skip: false },
      { mission_id: m3.id, requires_mission_id: m2.id, allow_skip: false },
    ]),
  ]);

  return { created: true, campaignId: campaign.id };
}

function normalizeStepsInput(steps) {
  return (steps ?? [])
    .map((s, i) => ({
      id: s.id ? Number(s.id) : null,
      surface: String(s.surface || "").trim(),
      detail: s.detail ? String(s.detail).trim() : null,
      planned_minutes: s.planned_minutes
        ? Number(s.planned_minutes)
        : null,
      order_index:
        typeof s.order_index === "number" ? s.order_index : i,
    }))
    .filter((s) => s.surface.length > 0);
}

async function assertCampaignOwned(campaignId, championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, champion_id, title, status, result, why")
    .eq("id", campaignId)
    .single();
  if (error) throw error;
  if (Number(data.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado à campanha");
  }
  return data;
}

/**
 * Cria frente: campanha + 1 capítulo + 1 missão + passos.
 * payload: { title, why, result, chapterTitle?, missionTitle, missionWhy?,
 *   weekdays?, timeOfDay?, plannedMinutes?, steps: [{surface, detail?, planned_minutes?}] }
 */
export async function createCampaignWithMission(championId, payload) {
  const title = String(payload?.title || "").trim();
  if (!title) throw new Error("Título da campanha é obrigatório");

  const steps = normalizeStepsInput(payload?.steps);
  if (!steps.length) throw new Error("Inclua pelo menos um passo");

  const missionTitle = String(
    payload?.missionTitle || payload?.mission_title || "Missão 1"
  ).trim();
  const chapterTitle = String(
    payload?.chapterTitle || payload?.chapter_title || "Capítulo 1"
  ).trim();

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .insert({
      champion_id: championId,
      title,
      status: "active",
      result: payload?.result ? String(payload.result).trim() : null,
      why: payload?.why ? String(payload.why).trim() : null,
      primary_stat: normalizePrimaryStat(
        payload?.primaryStat || payload?.primary_stat
      ),
      visibility:
        payload?.visibility === "public" ? "public" : "private",
      updated_at: now,
    })
    .select("*")
    .single();
  if (cErr) throw cErr;

  const { data: chapter, error: chErr } = await supabase
    .from("campaign_chapters")
    .insert({
      campaign_id: campaign.id,
      title: chapterTitle,
      status: "active",
      objective: payload?.result ? String(payload.result).trim() : null,
      order_index: 0,
    })
    .select("*")
    .single();
  if (chErr) throw chErr;

  const weekdays = Array.isArray(payload?.weekdays)
    ? payload.weekdays.filter(Boolean)
    : [];
  const plannedMinutes =
    payload?.plannedMinutes ?? payload?.planned_minutes ?? null;

  const { data: mission, error: mErr } = await supabase
    .from("missions")
    .insert({
      chapter_id: chapter.id,
      title: missionTitle,
      status: "available",
      why: payload?.missionWhy
        ? String(payload.missionWhy).trim()
        : payload?.mission_why
          ? String(payload.mission_why).trim()
          : null,
      weekdays,
      time_of_day: payload?.timeOfDay || payload?.time_of_day || null,
      planned_minutes: plannedMinutes ? Number(plannedMinutes) : null,
      order_index: 0,
    })
    .select("*")
    .single();
  if (mErr) throw mErr;

  const { error: sErr } = await supabase.from("mission_steps").insert(
    steps.map((s, i) => ({
      mission_id: mission.id,
      surface: s.surface,
      detail: s.detail,
      planned_minutes: s.planned_minutes,
      status: i === 0 ? "current" : "pending",
      order_index: i,
    }))
  );
  if (sErr) throw sErr;

  return {
    campaignId: campaign.id,
    missionId: mission.id,
  };
}

/**
 * Árvore para o editor.
 * @returns {{
 *   campaign: object,
 *   chapter: object,
 *   mission: object,
 *   steps: object[],
 *   chapters: Array<{
 *     id, title, status, objective, order_index,
 *     missions: Array<{
 *       id, title, status, why, weekdays, time_of_day, planned_minutes, order_index,
 *       dependencies: number[],
 *       steps: Array<{ id, surface, status, order_index }>
 *     }>
 *   }>
 * }}
 * @param {number|null} [selectedMissionId] força a missão editada
 */
export async function getCampaignEditor(
  championId,
  campaignId,
  selectedMissionId = null
) {
  const campaign = await assertCampaignOwned(campaignId, championId);
  const supabase = createAdminClient();

  const [{ data: chaptersRaw, error: chErr }, { data: focus }] =
    await Promise.all([
      supabase
        .from("campaign_chapters")
        .select(
          `
        id, title, status, objective, order_index,
        missions (
          id, title, status, why, weekdays, time_of_day,
          planned_minutes, order_index, resume_note,
          mission_steps (
            id, surface, detail, planned_minutes, status, order_index
          )
        )
      `
        )
        .eq("campaign_id", campaignId)
        .order("order_index", { ascending: true }),
      supabase
        .from("user_focus")
        .select("active_mission_id")
        .eq("champion_id", championId)
        .maybeSingle(),
    ]);
  if (chErr) throw chErr;

  const missionIds = (chaptersRaw ?? []).flatMap((ch) =>
    (ch.missions ?? []).map((m) => m.id)
  );

  let depsByMission = new Map();
  if (missionIds.length) {
    const { data: deps } = await supabase
      .from("mission_dependencies")
      .select("mission_id, requires_mission_id")
      .in("mission_id", missionIds);
    for (const d of deps ?? []) {
      const key = Number(d.mission_id);
      const list = depsByMission.get(key) || [];
      list.push(Number(d.requires_mission_id));
      depsByMission.set(key, list);
    }
  }

  const chapters = [...(chaptersRaw ?? [])]
    .sort((a, b) => a.order_index - b.order_index)
    .map((ch) => {
      const missions = [...(ch.missions ?? [])]
        .sort((a, b) => a.order_index - b.order_index)
        .map((m) => {
          const stepsSorted = [...(m.mission_steps ?? [])].sort(
            (a, b) => a.order_index - b.order_index
          );
          return {
            id: m.id,
            title: m.title,
            status: m.status,
            why: m.why,
            weekdays: m.weekdays ?? [],
            time_of_day: m.time_of_day,
            planned_minutes: m.planned_minutes,
            order_index: m.order_index,
            dependencies: depsByMission.get(Number(m.id)) || [],
            steps: stepsSorted.map((s) => ({
              id: s.id,
              surface: s.surface,
              status: s.status,
              order_index: s.order_index,
            })),
            _fullSteps: stepsSorted,
          };
        });
      return {
        id: ch.id,
        title: ch.title,
        status: ch.status,
        objective: ch.objective,
        order_index: ch.order_index,
        missions,
      };
    });

  const allMissions = chapters.flatMap((ch) =>
    ch.missions.map((m) => ({
      ...m,
      chapter: {
        id: ch.id,
        title: ch.title,
        status: ch.status,
        objective: ch.objective,
        order_index: ch.order_index,
      },
    }))
  );

  const focusId = focus?.active_mission_id
    ? Number(focus.active_mission_id)
    : null;
  const forcedId = selectedMissionId ? Number(selectedMissionId) : null;
  const rank = {
    active: 0,
    paused: 1,
    in_progress: 2,
    available: 3,
    locked: 8,
    completed: 9,
    skipped: 10,
  };

  let mission =
    (forcedId && allMissions.find((m) => Number(m.id) === forcedId)) ||
    (focusId && allMissions.find((m) => Number(m.id) === focusId)) ||
    null;

  if (!mission) {
    const editable = allMissions
      .filter((m) =>
        ["active", "paused", "in_progress", "available"].includes(m.status)
      )
      .sort(
        (a, b) =>
          (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
          a.order_index - b.order_index
      );
    mission = editable[0] || allMissions[0] || null;
  }

  if (!mission) {
    throw new Error("Campanha sem missões para editar");
  }

  const steps = (mission._fullSteps || []).map((s) => ({
    id: s.id,
    surface: s.surface,
    detail: s.detail,
    planned_minutes: s.planned_minutes,
    status: s.status,
    order_index: s.order_index,
  }));

  const chaptersPublic = chapters.map((ch) => ({
    ...ch,
    missions: ch.missions.map(({ _fullSteps, ...m }) => m),
  }));

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      result: campaign.result,
      why: campaign.why,
      primary_stat: campaign.primary_stat || "inteligence",
      visibility: campaign.visibility || "private",
    },
    chapter: mission.chapter,
    mission: {
      id: mission.id,
      title: mission.title,
      status: mission.status,
      why: mission.why,
      weekdays: mission.weekdays ?? [],
      time_of_day: mission.time_of_day,
      planned_minutes: mission.planned_minutes,
      order_index: mission.order_index,
      dependencies: mission.dependencies || [],
    },
    steps,
    chapters: chaptersPublic,
  };
}

/**
 * Atualiza campanha + missão selecionada + sync de passos.
 * Não apaga passos `done`. Novos passos entram como `pending`.
 */
export async function updateCampaignEditor(championId, campaignId, payload) {
  await assertCampaignOwned(campaignId, championId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const missionId = Number(payload?.mission?.id);
  if (!missionId) throw new Error("Missão inválida");

  const tree = await getMissionTree(missionId);
  if (Number(tree.campaign?.id) !== Number(campaignId)) {
    throw new Error("Missão não pertence a esta campanha");
  }
  if (Number(tree.campaign.champion_id) !== Number(championId)) {
    throw new Error("Acesso negado");
  }

  const camp = payload.campaign || {};
  const mis = payload.mission || {};
  const incoming = normalizeStepsInput(payload.steps);

  const nextVisibility =
    camp.visibility === "public"
      ? "public"
      : camp.visibility === "private"
        ? "private"
        : tree.campaign.visibility || "private";
  const wasPublic = (tree.campaign.visibility || "private") === "public";

  await Promise.all([
    supabase
      .from("campaigns")
      .update({
        title: String(camp.title || tree.campaign.title).trim(),
        why:
          camp.why != null
            ? String(camp.why).trim() || null
            : tree.campaign.why,
        result:
          camp.result != null
            ? String(camp.result).trim() || null
            : tree.campaign.result,
        primary_stat: normalizePrimaryStat(
          camp.primary_stat ?? camp.primaryStat ?? tree.campaign.primary_stat
        ),
        visibility: nextVisibility,
        updated_at: now,
      })
      .eq("id", campaignId)
      .eq("champion_id", championId),
    supabase
      .from("missions")
      .update({
        title: String(mis.title || tree.mission.title).trim(),
        why:
          mis.why != null
            ? String(mis.why).trim() || null
            : tree.mission.why,
        weekdays: Array.isArray(mis.weekdays)
          ? mis.weekdays
          : tree.mission.weekdays ?? [],
        time_of_day:
          mis.time_of_day !== undefined
            ? mis.time_of_day || null
            : tree.mission.time_of_day,
        planned_minutes:
          mis.planned_minutes !== undefined
            ? mis.planned_minutes
              ? Number(mis.planned_minutes)
              : null
            : tree.mission.planned_minutes,
        updated_at: now,
      })
      .eq("id", missionId),
  ]);

  if (!wasPublic && nextVisibility === "public") {
    await evaluateAchievements(championId);
  }

  const existing = tree.steps ?? [];
  const existingById = new Map(existing.map((s) => [Number(s.id), s]));
  const keptIds = new Set();

  for (let i = 0; i < incoming.length; i++) {
    const row = incoming[i];
    row.order_index = i;
    if (row.id && existingById.has(row.id)) {
      keptIds.add(row.id);
      await supabase
        .from("mission_steps")
        .update({
          surface: row.surface,
          detail: row.detail,
          planned_minutes: row.planned_minutes,
          order_index: i,
        })
        .eq("id", row.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("mission_steps")
        .insert({
          mission_id: missionId,
          surface: row.surface,
          detail: row.detail,
          planned_minutes: row.planned_minutes,
          status: "pending",
          order_index: i,
        })
        .select("id")
        .single();
      if (error) throw error;
      keptIds.add(Number(inserted.id));
    }
  }

  const toRemove = existing.filter(
    (s) =>
      !keptIds.has(Number(s.id)) &&
      (s.status === "pending" || s.status === "current")
  );
  if (toRemove.length) {
    await supabase
      .from("mission_steps")
      .delete()
      .in(
        "id",
        toRemove.map((s) => s.id)
      );
  }

  const { data: afterSteps } = await supabase
    .from("mission_steps")
    .select("id, status, order_index")
    .eq("mission_id", missionId)
    .order("order_index", { ascending: true });

  const list = afterSteps ?? [];
  const hasCurrent = list.some((s) => s.status === "current");
  if (!hasCurrent) {
    const next = list.find((s) => s.status === "pending") || null;
    if (next) {
      await supabase
        .from("mission_steps")
        .update({ status: "current" })
        .eq("id", next.id);
    }
  }

  return getCampaignEditor(championId, campaignId, missionId);
}

export async function addChapter(
  championId,
  campaignId,
  { title, objective } = {}
) {
  await assertCampaignOwned(campaignId, championId);
  const supabase = createAdminClient();
  const name = String(title || "").trim();
  if (!name) throw new Error("Título do capítulo é obrigatório");

  const { data: existing } = await supabase
    .from("campaign_chapters")
    .select("id, order_index")
    .eq("campaign_id", campaignId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing?.length ? existing[0].order_index + 1 : 0;
  const status = existing?.length ? "available" : "active";

  const { data: chapter, error } = await supabase
    .from("campaign_chapters")
    .insert({
      campaign_id: campaignId,
      title: name,
      status,
      objective: objective ? String(objective).trim() : null,
      order_index: nextIndex,
    })
    .select("*")
    .single();
  if (error) throw error;

  return getCampaignEditor(championId, campaignId);
}

export async function addMission(
  championId,
  chapterId,
  {
    title,
    why,
    weekdays,
    time_of_day,
    planned_minutes,
    dependsOnPrevious,
  } = {}
) {
  const supabase = createAdminClient();
  const { data: chapter, error: chErr } = await supabase
    .from("campaign_chapters")
    .select("id, campaign_id, campaigns!inner(champion_id)")
    .eq("id", chapterId)
    .single();
  if (chErr) throw chErr;

  const campChampion = Array.isArray(chapter.campaigns)
    ? chapter.campaigns[0]?.champion_id
    : chapter.campaigns?.champion_id;
  if (Number(campChampion) !== Number(championId)) {
    throw new Error("Acesso negado ao capítulo");
  }

  const name = String(title || "").trim();
  if (!name) throw new Error("Título da missão é obrigatório");

  const { data: siblings } = await supabase
    .from("missions")
    .select("id, order_index")
    .eq("chapter_id", chapterId)
    .order("order_index", { ascending: false });

  const nextIndex = siblings?.length ? siblings[0].order_index + 1 : 0;
  const previous =
    siblings?.length > 0
      ? siblings.sort((a, b) => b.order_index - a.order_index)[0]
      : null;

  const useDep = Boolean(dependsOnPrevious) && previous;
  const status = useDep ? "locked" : "available";

  const { data: mission, error: mErr } = await supabase
    .from("missions")
    .insert({
      chapter_id: chapterId,
      title: name,
      status,
      why: why ? String(why).trim() : null,
      weekdays: Array.isArray(weekdays) ? weekdays : [],
      time_of_day: time_of_day || null,
      planned_minutes: planned_minutes ? Number(planned_minutes) : null,
      order_index: nextIndex,
    })
    .select("*")
    .single();
  if (mErr) throw mErr;

  await supabase.from("mission_steps").insert({
    mission_id: mission.id,
    surface: "Definir primeiro passo",
    detail: null,
    planned_minutes: 10,
    status: "current",
    order_index: 0,
  });

  if (useDep) {
    await supabase.from("mission_dependencies").insert({
      mission_id: mission.id,
      requires_mission_id: previous.id,
      allow_skip: false,
    });
  }

  return getCampaignEditor(championId, chapter.campaign_id, mission.id);
}

export async function archiveCampaign(championId, campaignId) {
  await assertCampaignOwned(campaignId, championId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("campaigns")
    .update({ status: "archived", updated_at: now })
    .eq("id", campaignId)
    .eq("champion_id", championId);

  const { data: focus } = await supabase
    .from("user_focus")
    .select("active_mission_id")
    .eq("champion_id", championId)
    .maybeSingle();

  if (focus?.active_mission_id) {
    try {
      const tree = await getMissionTree(focus.active_mission_id);
      if (Number(tree.campaign?.id) === Number(campaignId)) {
        await supabase.from("user_focus").upsert({
          champion_id: championId,
          active_mission_id: null,
          updated_at: now,
        });
      }
    } catch {
      /* ignore */
    }
  }

  return { archived: true, campaignId: Number(campaignId) };
}

export async function restoreCampaign(championId, campaignId) {
  await assertCampaignOwned(campaignId, championId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "active", updated_at: now })
    .eq("id", campaignId)
    .eq("champion_id", championId)
    .eq("status", "archived");
  if (error) throw error;

  return { restored: true, campaignId: Number(campaignId) };
}
