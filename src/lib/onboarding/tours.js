const STORAGE_PREFIX = "tobias_tours_v2_";

/** @typedef {{ id: string, title: string, body: string, anchor?: string, ctaHref?: string, ctaLabel?: string }} TourStep */

/**
 * Tours contextuais — um por área, mastigado.
 * `requires` = tours que precisam estar concluídos antes.
 */
export const TOURS = {
  continue: {
    id: "continue",
    path: "/",
    match: (p) => p === "/",
    requires: [],
    /** Tour só no estado vazio (sem missão em foco). */
    skipIfMission: true,
    nextHref: "/campaigns/new",
    nextLabel: "Criar primeira campanha",
    steps: [
      {
        id: "welcome",
        title: "Aqui é o Continuar",
        body: "Esta é a tela principal do Tobias. Sempre que abrir o app, venha aqui para ver o próximo passo — sem decidir do zero.",
        anchor: "tour-continue-header",
      },
      {
        id: "first-campaign",
        title: "Primeiro: uma campanha",
        body: "Campanha = uma frente da vida (academia, finanças…). Sem campanha, não há passo para executar. Vamos criar a sua primeira.",
        anchor: "tour-continue-empty",
        ctaHref: "/campaigns/new",
        ctaLabel: "Criar primeira campanha",
      },
    ],
  },

  "editor-create": {
    id: "editor-create",
    path: "/campaigns/new",
    match: (p) => p === "/campaigns/new",
    requires: [],
    nextHref: "/",
    nextLabel: "Voltar ao Continuar",
    steps: [
      {
        id: "editor-intro",
        title: "Editor da frente",
        body: "Aqui você monta a campanha: título, por quê, missão e passos. Preencha no seu ritmo — só o essencial basta para começar.",
        anchor: "tour-editor-header",
      },
      {
        id: "editor-title",
        title: "Nome e motivo",
        body: "Dê um nome claro (ex.: Academia) e um “por quê” curto. Isso aparece no Continuar e lembra o motivo quando a preguiça bater.",
        anchor: "tour-editor-meta",
      },
      {
        id: "editor-steps",
        title: "Passos mastigados",
        body: "Cada passo é uma ação pequena (~minutos). Escreva o que fazer na superfície; o detalhe é opcional. Depois é só executar um de cada vez.",
        anchor: "tour-editor-steps",
      },
      {
        id: "editor-save",
        title: "Criar e focar",
        body: "Toque em Criar frente. Se deixar “focar depois de criar” ligado, o Tobias já manda essa campanha para o Continuar.",
        anchor: "tour-editor-save",
        ctaHref: "/",
        ctaLabel: "Já criei — ir ao Continuar",
      },
    ],
  },

  "continue-play": {
    id: "continue-play",
    path: "/",
    match: (p) => p === "/",
    requires: [],
    /** Só mostra se já existe missão em foco (painel cheio). Controlado no host via hasMission. */
    needsMission: true,
    /** Não mostrar o tour de “criar primeira” se a home já tem missão. */
    skipIfMission: false,
    nextHref: "/timer",
    nextLabel: "Conhecer o Timer",
    steps: [
      {
        id: "mission",
        title: "Missão em foco",
        body: "O título grande é o que você está fazendo agora. Abaixo: campanha, capítulo e progresso dos passos.",
        anchor: "tour-continue-header",
      },
      {
        id: "steps",
        title: "Lista de passos",
        body: "O passo atual fica destacado. Toque para ver o detalhe. Quando terminar, use Concluir passo — o próximo vira o atual.",
        anchor: "tour-continue-steps",
      },
      {
        id: "timer-here",
        title: "Timer nesta tela",
        body: "À direita (ou abaixo no celular) você mede a sessão do passo. Use Flutuar no PC para manter o cronômetro por cima. Também existe a página Timer para pomodoro livre.",
        anchor: "tour-continue-timer",
      },
      {
        id: "next-timer",
        title: "Próximo: Timer",
        body: "Agora vamos à página Timer — foco e descanso no seu ritmo, mesmo fora de uma missão.",
        ctaHref: "/timer",
        ctaLabel: "Abrir Timer",
      },
    ],
  },

  timer: {
    id: "timer",
    path: "/timer",
    match: (p) => p === "/timer" || p.startsWith("/timer/"),
    /** Desbloqueia após o tour da home com missão (ou se o usuário já pulou o fluxo). */
    requires: ["continue-play"],
    nextHref: "/campaigns",
    nextLabel: "Ver Campanhas",
    steps: [
      {
        id: "timer-intro",
        title: "Pomodoro livre",
        body: "Use quando quiser focar sem estar no Continuar. No PC, Flutuar abre o cronômetro por cima de outros programas.",
        anchor: "tour-timer-header",
      },
      {
        id: "timer-controls",
        title: "Iniciar, pausar, encerrar",
        body: "Inicie um bloco de foco. Pausar congela; Encerrar zera. Flutuar (ao lado) abre a janelinha. No fim, o Tobias pode perguntar se marca o passo da missão em foco.",
        anchor: "tour-timer-controls",
      },
      {
        id: "timer-settings",
        title: "Seus tempos",
        body: "Ajuste minutos de foco e descanso. Clássico: 25/5. Pode ser 50/10, 15/5… o que funcionar para você.",
        anchor: "tour-timer-settings",
      },
      {
        id: "next-campaigns",
        title: "Próximo: Campanhas",
        body: "Na lista de campanhas você troca o foco, edita frentes e arquiva o que não precisa agora.",
        ctaHref: "/campaigns",
        ctaLabel: "Abrir Campanhas",
      },
    ],
  },

  campaigns: {
    id: "campaigns",
    path: "/campaigns",
    match: (p) => p === "/campaigns",
    requires: ["timer"],
    nextHref: "/community",
    nextLabel: "Ver Comunidade",
    steps: [
      {
        id: "list",
        title: "Suas frentes",
        body: "Cada card é uma campanha. Progresso, missão ativa e se está em foco aparecem aqui.",
        anchor: "tour-campaigns-header",
      },
      {
        id: "new",
        title: "Nova frente",
        body: "Sempre que quiser outra área da vida, use Nova frente. O editor é o mesmo da primeira campanha.",
        anchor: "tour-campaigns-new",
      },
      {
        id: "focus",
        title: "Continuar nesta frente",
        body: "Isso troca o foco do Continuar para esta campanha. Só uma frente fica “em foco” por vez.",
        anchor: "tour-campaigns-focus",
      },
      {
        id: "edit",
        title: "Editar",
        body: "Abre o editor: capítulos, missões, passos, dias da agenda, atributo e se a campanha é privada ou pública.",
        anchor: "tour-campaigns-edit",
      },
      {
        id: "archive",
        title: "Arquivar",
        body: "Tira da lista ativa sem apagar. Encontra de novo no filtro Arquivadas e pode restaurar quando quiser.",
        anchor: "tour-campaigns-archive",
      },
      {
        id: "filters",
        title: "Filtros",
        body: "Todas · Hoje (só agenda do dia) · Arquivadas. Use Hoje quando quiser ver só o que cabe na data. Sugestões oficiais ficam na Comunidade — não nesta lista.",
        anchor: "tour-campaigns-filters",
      },
      {
        id: "next-community",
        title: "Próximo: Comunidade",
        body: "Lá você aceita protocolos prontos (Saitama, Baki…), entra em desafios, posta na Praça e cria clãs com amigos.",
        ctaHref: "/community",
        ctaLabel: "Abrir Comunidade",
      },
    ],
  },

  "editor-edit": {
    id: "editor-edit",
    path: "/campaigns/:id/edit",
    match: (p) => /^\/campaigns\/[^/]+\/edit$/.test(p),
    requires: ["campaigns"],
    steps: [
      {
        id: "edit-intro",
        title: "Ajustar a frente",
        body: "Mesmo editor da criação. Mude passos, agenda (dias da semana), atributo primário e visibilidade — e salve.",
        anchor: "tour-editor-header",
      },
      {
        id: "edit-chapters",
        title: "Capítulos e missões",
        body: "Campanhas grandes ganham capítulos. Você pode adicionar missões novas e encadear dependências.",
        anchor: "tour-editor-structure",
      },
      {
        id: "edit-share",
        title: "Convidar amigo",
        body: "Gere um código CP-XXXX-XXXX. Quem resgatar na Comunidade recebe uma cópia privada desta campanha — sem mexer na sua.",
        anchor: "tour-editor-share",
      },
      {
        id: "edit-publish",
        title: "Enviar para Comunidade",
        body: "Quer publicar no catálogo? Escreva um resumo e envie. Um moderador aprova; se passar, outros podem aceitar o snapshot que você mandou.",
        anchor: "tour-editor-publish",
      },
      {
        id: "edit-save",
        title: "Salvar",
        body: "Nada entra no Continuar até salvar. Depois volte ao Continuar ou à lista de Campanhas.",
        anchor: "tour-editor-save",
      },
    ],
  },

  community: {
    id: "community",
    path: "/community",
    match: (p) => p === "/community" || p.startsWith("/community/"),
    requires: ["campaigns"],
    nextHref: "/finance",
    nextLabel: "Ver Finanças",
    steps: [
      {
        id: "intro",
        title: "Comunidade",
        body: "Espaço compartilhado — separado das suas frentes pessoais. Aqui entram catálogo, desafios, praça e clãs.",
        anchor: "tour-community-header",
      },
      {
        id: "redeem",
        title: "Código de amigo",
        body: "Se alguém te mandou CP-XXXX-XXXX, cole aqui e resgate. Você ganha uma cópia privada da campanha dele.",
        anchor: "tour-community-redeem",
      },
      {
        id: "tabs",
        title: "Quatro abas",
        body: "Campanhas sugeridas (oficiais + da galera) · Desafios (semana em grupo) · Praça (1 post/dia) · Clãs (2–5 amigos, 7 dias, mesmo protocolo).",
        anchor: "tour-community-tabs",
      },
      {
        id: "catalog",
        title: "Aceitar campanha",
        body: "Toque em Aceitar para clonar o protocolo na sua lista — com XP e atributo na hora. Filtros: Todas, Oficiais ou Da comunidade.",
        anchor: "tour-community-catalog",
      },
      {
        id: "next-finance",
        title: "Próximo: Finanças",
        body: "Ledger simples: lançamentos por categoria e gráficos do período — separado do Continuar.",
        ctaHref: "/finance",
        ctaLabel: "Abrir Finanças",
      },
    ],
  },

  finance: {
    id: "finance",
    path: "/finance",
    match: (p) => p === "/finance" || p.startsWith("/finance/"),
    requires: ["campaigns"],
    nextHref: "/streaks",
    nextLabel: "Ver Sequências",
    steps: [
      {
        id: "intro",
        title: "Finanças",
        body: "Aqui você registra entradas e saídas por categoria. Não é o Continuar — é um satélite para organizar o dinheiro.",
        anchor: "tour-finance-header",
      },
      {
        id: "chart",
        title: "Gráficos",
        body: "Na aba Gráficos você escolhe o período e o tipo de visualização: pizza, barras, comparativo ou saldo.",
        anchor: "tour-finance-chart",
      },
      {
        id: "form",
        title: "Novo lançamento",
        body: "Valor, data, categoria e, se quiser, recorrência (diária, semanal, mensal ou anual). Categorias padrão já vêm prontas.",
        anchor: "tour-finance-form",
      },
      {
        id: "next-streaks",
        title: "Próximo: Sequências",
        body: "Sequências são hábitos diários privados (marcar o dia, escudos, calendário).",
        ctaHref: "/streaks",
        ctaLabel: "Abrir Sequências",
      },
    ],
  },

  streaks: {
    id: "streaks",
    path: "/streaks",
    match: (p) => p === "/streaks" || p.startsWith("/streaks/"),
    requires: ["campaigns"],
    nextHref: "/profile",
    nextLabel: "Ver Perfil",
    steps: [
      {
        id: "intro",
        title: "Sequências",
        body: "Só você vê. Crie hábitos para construir (leitura, corda…) ou para evitar (junk food). O objetivo é não quebrar a sequência.",
        anchor: "tour-streaks-header",
      },
      {
        id: "create",
        title: "Nova sequência",
        body: "Dê um nome, escolha ícone e tipo. Opcional: vincular campanhas — quando avançar nelas, o dia pode marcar sozinho.",
        anchor: "tour-streaks-new",
      },
      {
        id: "mark",
        title: "Marcar o dia",
        body: "Toque para registrar hoje. O calendário mostra a sequência; escudos ajudam se um dia escapar. Privado — sem ranking.",
        anchor: "tour-streaks-list",
      },
      {
        id: "next-profile",
        title: "Próximo: Perfil",
        body: "No Perfil ficam nível, atributos, bio e pins. O perfil é público; privacidade é da campanha e das sequências.",
        ctaHref: "/profile",
        ctaLabel: "Abrir Perfil",
      },
    ],
  },

  profile: {
    id: "profile",
    path: "/profile",
    match: (p) => p === "/profile" || p.startsWith("/profile/"),
    requires: ["campaigns"],
    nextHref: "/analytics",
    nextLabel: "Ver Atividade",
    steps: [
      {
        id: "identity",
        title: "Sua ficha",
        body: "Nome, título dinâmico, nível e XP. O perfil é público — o que você escolhe mostrar são as campanhas públicas.",
        anchor: "tour-profile-header",
      },
      {
        id: "attrs",
        title: "Atributos",
        body: "Força, Agilidade, Inteligência, Vitalidade sobem ao concluir passos. Sabedoria cresce com o conjunto.",
        anchor: "tour-profile-attrs",
      },
      {
        id: "pins",
        title: "Bio e pins",
        body: "Escreva quem você é nesta jornada. Marcos (conquistas) podem ser fixados — até 3 pins na ficha.",
        anchor: "tour-profile-bio",
      },
      {
        id: "next-analytics",
        title: "Próximo: Atividade",
        body: "Ali você vê em quais dias produziu mais, com base nas sessões concluídas.",
        ctaHref: "/analytics",
        ctaLabel: "Abrir Atividade",
      },
    ],
  },

  analytics: {
    id: "analytics",
    path: "/analytics",
    match: (p) => p === "/analytics" || p.startsWith("/analytics/"),
    requires: ["profile"],
    nextHref: "/champions",
    nextLabel: "Ver Campeões",
    steps: [
      {
        id: "intro",
        title: "Atividade",
        body: "Espelho do esforço: minutos por dia a partir das sessões. Sem cobrança — só informação.",
        anchor: "tour-analytics-header",
      },
      {
        id: "filter",
        title: "Filtro por campanha",
        body: "Veja o total ou isole uma frente. Útil para comparar academia vs. estudos, por exemplo.",
        anchor: "tour-analytics-filter",
      },
      {
        id: "chart",
        title: "Dias fortes e fracos",
        body: "Barras altas = dias com mais tempo registrado. Use para ajustar ritmo, não para se culpar.",
        anchor: "tour-analytics-chart",
      },
      {
        id: "next-champions",
        title: "Próximo: Campeões",
        body: "Perfis de outras pessoas — inspiração, não ranking. Campanhas privadas não aparecem.",
        ctaHref: "/champions",
        ctaLabel: "Abrir Campeões",
      },
    ],
  },

  champions: {
    id: "champions",
    path: "/champions",
    match: (p) => p === "/champions",
    requires: ["analytics"],
    steps: [
      {
        id: "intro",
        title: "Campeões",
        body: "Lista os outros no Tobias. Toque num nome para ver a ficha e as campanhas que eles tornaram públicas.",
        anchor: "tour-champions-header",
      },
      {
        id: "empty",
        title: "Lista vazia?",
        body: "Se ainda não houver ninguém, espere outros entrarem com convite — ou volte depois.",
        anchor: "tour-champions-list",
      },
      {
        id: "done",
        title: "Você já sabe o caminho",
        body: "Ciclo: Continuar → Timer → Campanhas → Comunidade → Finanças → Sequências → Perfil e Atividade. Bom foco.",
        ctaHref: "/",
        ctaLabel: "Voltar ao Continuar",
      },
    ],
  },
};

export function storageKey(championId) {
  return `${STORAGE_PREFIX}${championId || "anon"}`;
}

export function readProgress(championId) {
  if (typeof window === "undefined") {
    return { completed: [], skippedAll: false };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(championId));
    if (!raw) return { completed: [], skippedAll: false };
    const parsed = JSON.parse(raw);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      skippedAll: Boolean(parsed.skippedAll),
    };
  } catch {
    return { completed: [], skippedAll: false };
  }
}

export function writeProgress(championId, progress) {
  try {
    window.localStorage.setItem(
      storageKey(championId),
      JSON.stringify({
        completed: progress.completed || [],
        skippedAll: Boolean(progress.skippedAll),
      })
    );
  } catch {
    /* ignore */
  }
}

export function isTourDone(championId, tourId) {
  return readProgress(championId).completed.includes(tourId);
}

export function markTourDone(championId, tourId) {
  const progress = readProgress(championId);
  if (!progress.completed.includes(tourId)) {
    progress.completed = [...progress.completed, tourId];
  }
  writeProgress(championId, progress);
  return progress;
}

export function clearTour(championId, tourId) {
  const progress = readProgress(championId);
  progress.completed = progress.completed.filter((id) => id !== tourId);
  progress.skippedAll = false;
  writeProgress(championId, progress);
  return progress;
}

export function clearAllTours(championId) {
  writeProgress(championId, { completed: [], skippedAll: false });
}

export function skipAllTours(championId) {
  writeProgress(championId, {
    ...readProgress(championId),
    skippedAll: true,
  });
}

export function isTourUnlocked(championId, tourId) {
  const tour = TOURS[tourId];
  if (!tour) return false;
  const { completed, skippedAll } = readProgress(championId);
  if (skippedAll) return false;
  return (tour.requires || []).every((req) => completed.includes(req));
}

export function findTourForPath(pathname) {
  return Object.values(TOURS).find((t) => t.match(pathname));
}

/** Tours possíveis nesta rota (ex.: continue vs continue-play). */
export function toursForPath(pathname) {
  return Object.values(TOURS).filter((t) => t.match(pathname));
}

/**
 * Tour relevante da rota atual (respeita empty vs com missão na home).
 */
export function pickTourForPath(pathname, missionHint = null) {
  const candidates = toursForPath(pathname);
  const matched = candidates.find((t) => {
    if (t.skipIfMission) {
      if (missionHint == null) return false;
      if (missionHint) return false;
    }
    if (t.needsMission && missionHint !== true) return false;
    return true;
  });
  if (matched) return matched;
  // Home ainda carregando: não chute continue vs continue-play
  if (pathname === "/" && missionHint == null) return null;
  return candidates[0] || null;
}

/** true se o guia desta página já foi concluído (ou pulado tudo). */
export function isPageTourDone(championId, pathname, missionHint = null) {
  if (!championId) return true;
  const progress = readProgress(championId);
  if (progress.skippedAll) return true;
  const tour = pickTourForPath(pathname, missionHint);
  // Sem tour conhecido (ex.: home carregando) → esconde o botão Guia
  if (!tour) return true;
  return progress.completed.includes(tour.id);
}

export const REOPEN_TOUR_EVENT = "tobias:reopen-page-tour";
export const TOUR_PROGRESS_EVENT = "tobias:tour-progress";

export function emitTourProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_PROGRESS_EVENT));
  }
}

export function reopenPageTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REOPEN_TOUR_EVENT));
  }
}
