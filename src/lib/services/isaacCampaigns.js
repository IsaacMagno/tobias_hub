/**
 * Campanhas de vida do Isaac (champion_id típico = 2).
 * Idempotente por título da campanha.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createFullCampaign } from "@/lib/services/campaignFactory";

const TITLES = {
  academia: "Academia — hipertrofia",
  leitura: "Leitura — Diário de um mago",
  prompts: "Prompts e IA",
  programacao: "Programação — agência + Dofus",
  financas: "Finanças — dívidas e disciplina",
};

const DETAIL_A =
  "Supino máq/reto 3×8–10 · Inclinação 3×10–12 · Desenvolvimento 3×8–10 · Elevação lateral 3×12–15 · Tríceps pulley 3×10–12";
const DETAIL_B =
  "Puxada 3×10–12 · Remada 3×8–10 · Remada unilateral 3×10–12 · Rosca direta 3×10–12 · Rosca martelo 3×12–15";
const DETAIL_C =
  "Leg press/agachamento 3×8–10 · Extensora 3×10–12 · Flexora 3×10–12 · Panturrilha 3×12–15 · Prancha 3×30–45s";

function gymSteps(blockLabel, blockDetail) {
  return [
    {
      surface: "Sacola pronta + sair",
      detail: "Tênis, camisa, shorts, toalha, garrafa",
      planned_minutes: 10,
    },
    {
      surface: "Aquecer 5–8 min",
      detail: "Esteira/bike + mobilidade ombro/quadril",
      planned_minutes: 10,
    },
    {
      surface: blockLabel,
      detail: blockDetail,
      planned_minutes: 40,
    },
    {
      surface: "Cardio 20 min",
      detail: "Ritmo de conversa (bike/esteira). Não é HIIT.",
      planned_minutes: 20,
    },
    {
      surface: "Registrar no Tobias + ir embora",
      detail: null,
      planned_minutes: 5,
    },
  ];
}

function cardioSessionSteps(n) {
  return [
    {
      surface: `Sessão ${n}: tênis / esteira`,
      detail: "Só começar — sem otimizar",
      planned_minutes: 5,
    },
    {
      surface: `Sessão ${n}: cardio 20 min`,
      detail: "Contínuo, ritmo de conversa",
      planned_minutes: 20,
    },
    {
      surface: `Sessão ${n}: registrar no Tobias`,
      detail: null,
      planned_minutes: 5,
    },
  ];
}

function readingCycleSteps(n) {
  return [
    {
      surface: `Noite ${n}: livro e luz prontos`,
      detail: "Diário de um mago à mão",
      planned_minutes: 5,
    },
    {
      surface: `Noite ${n}: celular longe`,
      detail: "Fora do alcance da cama",
      planned_minutes: 5,
    },
    {
      surface: `Noite ${n}: ler 30 min`,
      detail: "Sem meta de páginas — só o tempo",
      planned_minutes: 30,
    },
    {
      surface: `Noite ${n}: marcar página + Tobias`,
      detail: null,
      planned_minutes: 5,
    },
  ];
}

function isaacDefs() {
  const gymWeek = (week) => [
    {
      title: `Semana ${week} — Treino A (empurrar)`,
      why: "Peito, ombro, tríceps + cardio 20 min",
      weekdays: ["seg"],
      time_of_day: "07:00",
      planned_minutes: 90,
      steps: gymSteps("Bloco A — Empurrar", DETAIL_A),
    },
    {
      title: `Semana ${week} — Treino B (puxar)`,
      why: "Costas, bíceps + cardio 20 min",
      weekdays: ["qua"],
      time_of_day: "07:00",
      planned_minutes: 90,
      steps: gymSteps("Bloco B — Puxar", DETAIL_B),
    },
    {
      title: `Semana ${week} — Treino C (pernas)`,
      why: "Pernas, core + cardio 20 min",
      weekdays: ["sex"],
      time_of_day: "07:00",
      planned_minutes: 90,
      steps: gymSteps("Bloco C — Pernas + core", DETAIL_C),
    },
  ];

  const cardioSteps = [];
  for (let n = 1; n <= 8; n++) cardioSteps.push(...cardioSessionSteps(n));

  const readingSteps = [];
  for (let n = 1; n <= 7; n++) readingSteps.push(...readingCycleSteps(n));

  return [
    {
      title: TITLES.academia,
      result:
        "Musculação ABC 3×/semana às 07:00 + cardio ~20 min todos os dias.",
      why: "Voltar ao movimento e ganhar músculo com rotina clara.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Voltar (2 semanas)",
          objective: "Cumprir 2 ciclos ABC + cardio nos dias livres",
          missions: [
            ...gymWeek(1),
            ...gymWeek(2),
            {
              title: "Cardio nos dias livres",
              why: "ter/qui/sab/dom — 20 min",
              weekdays: ["ter", "qui", "sab", "dom"],
              time_of_day: "07:00",
              planned_minutes: 30,
              steps: cardioSteps,
            },
          ],
        },
      ],
    },
    {
      title: TITLES.leitura,
      result:
        "Ler 30 min antes de dormir na maioria das noites; avançar Diário de um mago.",
      why: "Encerrar o dia com calma e constância, sem tela.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Hábito + Diário de um mago",
          objective: "7 noites de leitura",
          missions: [
            {
              title: "Noites de leitura",
              why: "30 min · livro físico",
              weekdays: [],
              time_of_day: "21:30",
              planned_minutes: 30,
              steps: readingSteps,
            },
          ],
        },
      ],
    },
    {
      title: TITLES.prompts,
      result: "~20 min/dia praticando prompts melhores e fluxo com IA.",
      why: "O diferencial é pedir bem e revisar bem.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Kit mínimo",
          objective: "Base de prompts + exercícios",
          missions: [
            {
              title: "Prática diária de prompts",
              weekdays: [],
              time_of_day: "13:30",
              planned_minutes: 20,
              steps: [
                {
                  surface: "Montar 3 prompts-base",
                  detail:
                    "(1) explicar com contexto (2) pedir opções (3) criticar/revisar",
                  planned_minutes: 15,
                },
                {
                  surface: "Exercício: clareza",
                  detail: "Pedido vago → objetivo + restrições + formato",
                  planned_minutes: 15,
                },
                {
                  surface: "Exercício: contexto",
                  detail: "Colar trecho real e pedir ajuda ancorada",
                  planned_minutes: 15,
                },
                {
                  surface: "Exercício: exemplos",
                  detail: "Pedir 2–3 exemplos do que “bom” parece",
                  planned_minutes: 15,
                },
                {
                  surface: "Exercício: revisão",
                  detail: "IA critica a própria resposta; você ajusta",
                  planned_minutes: 15,
                },
                {
                  surface: "Aplicar num caso real",
                  detail: "Tobias, treino ou finanças — salvar o prompt útil",
                  planned_minutes: 20,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: TITLES.programacao,
      result:
        "Bloco 09:00–13:00 nos dias úteis com site da agência + Dofus nas 2 primeiras semanas.",
      why: "Proteger deep work e avançar projetos que já existem.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Planejar os dois",
          objective: "Escopo mínimo agência + Dofus + calendário",
          missions: [
            {
              title: "Planejar agência + Dofus",
              weekdays: ["seg", "ter", "qua", "qui", "sex"],
              time_of_day: "09:00",
              planned_minutes: 240,
              steps: [
                {
                  surface: "Escopo mínimo do site da agência",
                  detail: "3 entregas concretas (ex.: home, contato, portfolio)",
                  planned_minutes: 40,
                },
                {
                  surface: "Escopo mínimo Dofus",
                  detail: "3 entregas concretas do que você vai programar",
                  planned_minutes: 40,
                },
                {
                  surface: "Calendário das 2 semanas",
                  detail:
                    "Ex.: manhã cedo agência / restante Dofus, ou dias alternados",
                  planned_minutes: 30,
                },
                {
                  surface: "Repo/ambiente agência ok",
                  detail: "Abrir, rodar local, anotar comando",
                  planned_minutes: 30,
                },
                {
                  surface: "Repo/ambiente Dofus ok",
                  detail: "Idem",
                  planned_minutes: 30,
                },
              ],
            },
          ],
        },
        {
          title: "Cap. 2 — Executar o bloco",
          objective: "Rodar o bloco diário nos dois projetos",
          missions: [
            {
              title: "Blocos de execução (2 semanas)",
              weekdays: ["seg", "ter", "qua", "qui", "sex"],
              time_of_day: "09:00",
              planned_minutes: 240,
              steps: Array.from({ length: 10 }, (_, i) => {
                const d = i + 1;
                return [
                  {
                    surface: `Dia ${d}: abrir projeto do dia`,
                    detail: "Agência ou Dofus conforme calendário",
                    planned_minutes: 5,
                  },
                  {
                    surface: `Dia ${d}: bloco 1 — 2h foco`,
                    detail: null,
                    planned_minutes: 120,
                  },
                  {
                    surface: `Dia ${d}: nota/commit`,
                    detail: null,
                    planned_minutes: 10,
                  },
                  {
                    surface: `Dia ${d}: bloco 2 — 2h`,
                    detail: "Outro projeto ou continuar",
                    planned_minutes: 120,
                  },
                  {
                    surface: `Dia ${d}: fechar no Tobias`,
                    detail: null,
                    planned_minutes: 5,
                  },
                ];
              }).flat(),
            },
          ],
        },
      ],
    },
    {
      title: TITLES.financas,
      result: "Mapa de dívidas + 1 regra de gasto + planilha viva.",
      why: "Gasta mais do que precisa; falta disciplina e meta.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Enxergar a dívida",
          objective: "Total claro + meta mínima",
          missions: [
            {
              title: "Mapa de dívidas",
              weekdays: ["seg"],
              time_of_day: "20:00",
              planned_minutes: 45,
              steps: [
                {
                  surface: "Abrir a planilha antiga",
                  detail: "Só abrir; não organizar ainda",
                  planned_minutes: 15,
                },
                {
                  surface: "Listar todas as dívidas",
                  detail: "Nome, valor, juros se souber",
                  planned_minutes: 30,
                },
                {
                  surface: "Somar o total",
                  detail: "Um número único no topo",
                  planned_minutes: 15,
                },
                {
                  surface: "Definir meta mínima da semana",
                  detail: "Ex.: registrar 7 dias OU pagar X",
                  planned_minutes: 15,
                },
              ],
            },
          ],
        },
        {
          title: "Cap. 2 — Disciplina",
          objective: "Registro + regra simples",
          missions: [
            {
              title: "Disciplina e regra",
              weekdays: ["seg"],
              time_of_day: "20:00",
              planned_minutes: 45,
              steps: [
                {
                  surface: "Registrar 7 dias de gastos",
                  detail: "Qualquer app/planilha",
                  planned_minutes: 45,
                },
                {
                  surface: "Cortar 1 gasto inútil",
                  detail: "Nomear e cancelar/pausar",
                  planned_minutes: 20,
                },
                {
                  surface: "Escrever 1 regra simples",
                  detail: "Ex.: fora do essencial só Y/semana",
                  planned_minutes: 20,
                },
                {
                  surface: "Check semanal",
                  detail: "Olhar regra + total da semana",
                  planned_minutes: 45,
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Cria as 5 frentes do Isaac se ainda não existirem (por título).
 * Não define user_focus — deixa pickMissionId (smart focus) escolher.
 */
export async function ensureIsaacLifeCampaigns(championId) {
  const supabase = createAdminClient();
  const defs = isaacDefs();
  const created = [];
  const skipped = [];

  for (const def of defs) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id")
      .eq("champion_id", championId)
      .eq("title", def.title)
      .maybeSingle();

    if (existing) {
      skipped.push({ title: def.title, campaignId: existing.id });
      continue;
    }

    const campaignId = await createFullCampaign(supabase, championId, def);
    created.push({ title: def.title, campaignId });
  }

  // Garante que não há foco manual travado em demo antiga — null deixa smart focus agir
  await supabase.from("user_focus").upsert({
    champion_id: championId,
    active_mission_id: null,
    updated_at: new Date().toISOString(),
  });

  return { created, skipped, championId };
}

export const ISAAC_CAMPAIGN_TITLES = TITLES;
