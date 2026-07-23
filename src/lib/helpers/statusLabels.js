/** Labels PT-BR para status internos (DB continua em inglês). */

const CAMPAIGN = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  archived: "Arquivada",
};

const CHAPTER = {
  locked: "Bloqueado",
  available: "Disponível",
  active: "Ativo",
  completed: "Concluído",
};

const MISSION = {
  locked: "Bloqueada",
  available: "Disponível",
  active: "Ativa",
  in_progress: "Em andamento",
  paused: "Pausada",
  completed: "Concluída",
  skipped: "Ignorada",
};

const STEP = {
  pending: "Pendente",
  current: "Atual",
  done: "Concluído",
  skipped: "Ignorado",
};

export function labelCampaignStatus(status) {
  return CAMPAIGN[status] || status || "—";
}

export function labelChapterStatus(status) {
  return CHAPTER[status] || status || "—";
}

export function labelMissionStatus(status) {
  return MISSION[status] || status || "—";
}

export function labelStepStatus(status) {
  return STEP[status] || status || "—";
}
