/**
 * Catálogo oficial de sugestões de campanha (Fase 1).
 * Cada card traz XP de boas-vindas + atributo (status) alinhado à atividade.
 */
import { STAT_LABELS } from "@/lib/helpers/attributes";

const WEEK = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

function dayMission({ day, i, title, why, time, minutes, steps }) {
  return {
    title: title || `Dia ${i + 1}`,
    why: why || null,
    weekdays: [day],
    time_of_day: time || "08:00",
    planned_minutes: minutes ?? 30,
    steps,
  };
}

function weekOfDayMissions(buildDay) {
  return WEEK.map((day, i) => buildDay(day, i));
}

function saitamaDaySteps(dayLabel) {
  return [
    {
      surface: `${dayLabel}: aquecer 5 min`,
      detail: "Mobilidade + pulos leves",
      planned_minutes: 5,
    },
    {
      surface: `${dayLabel}: 100 flexões`,
      detail: "Pode quebrar em séries. Forma > velocidade.",
      planned_minutes: 25,
    },
    {
      surface: `${dayLabel}: 100 abdominais`,
      detail: "Não force a lombar",
      planned_minutes: 20,
    },
    {
      surface: `${dayLabel}: 100 agachamentos`,
      detail: "Profundidade que você controla",
      planned_minutes: 20,
    },
    {
      surface: `${dayLabel}: corrida 10 km (ou 60–90 min)`,
      detail: "Adapte volume se precisar; evolua honestamente.",
      planned_minutes: 75,
    },
    {
      surface: `${dayLabel}: registrar + hidratar`,
      detail: null,
      planned_minutes: 5,
    },
  ];
}

/**
 * XP estimado se concluir todos os passos (+25 por missão).
 * Alinhado a completeStep no motor de campanhas.
 */
export function estimateCampaignXp(def) {
  let stepXp = 0;
  let missions = 0;
  for (const ch of def?.chapters || []) {
    for (const m of ch.missions || []) {
      missions += 1;
      for (const s of m.steps || []) {
        stepXp += Math.max(5, Number(s.planned_minutes) || 10);
      }
    }
  }
  return stepXp + missions * 25;
}

function withRewards(template) {
  const acceptBonusXp =
    template.acceptBonusXp ??
    ({ easy: 25, medium: 40, hard: 60 }[template.difficulty] || 30);
  const acceptBonusAttr =
    template.acceptBonusAttr ??
    ({ easy: 2, medium: 3, hard: 5 }[template.difficulty] || 2);
  const estimatedXp = estimateCampaignXp(template.def);
  return {
    ...template,
    acceptBonusXp,
    acceptBonusAttr,
    estimatedXp,
    primary_stat_label: STAT_LABELS[template.primary_stat] || template.primary_stat,
  };
}

/** Templates públicos do Tobias. */
const RAW_TEMPLATES = [
  {
    id: "saitama",
    title: "Treino do Saitama",
    blurb:
      "A rotina lendária: 100 flexões, 100 abs, 100 agachamentos e corrida (~10 km) todo dia. Brutal, simples e memorável.",
    difficulty: "hard",
    primary_stat: "strength",
    tags: ["treino", "disciplina", "anime"],
    scheduleHint: "Diário · ~2–3 h (ou versão reduzida)",
    authorLabel: "Tobias",
    acceptBonusXp: 80,
    acceptBonusAttr: 6,
    def: {
      title: "Treino do Saitama",
      result: "7 dias da rotina Saitama (ou adaptação honesta) sem pular.",
      why: "Disciplina brutal e clara — um protocolo, sem desculpas.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Sete dias de herói",
          objective: "Completar a rotina cada dia da semana",
          missions: WEEK.map((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — rotina Saitama`,
              why: "100 flexões · 100 abs · 100 agachamentos · corrida ~10 km",
              time: "06:30",
              minutes: 150,
              steps: saitamaDaySteps(`D${i + 1}`),
            })
          ),
        },
      ],
    },
  },
  {
    id: "seven-nights-reading",
    title: "7 noites de leitura",
    blurb:
      "Trinta minutos com livro físico antes de dormir, celular longe. Instala o hábito sem drama.",
    difficulty: "easy",
    primary_stat: "inteligence",
    tags: ["leitura", "noite", "hábito"],
    scheduleHint: "Diário · 21:30 · ~40 min",
    authorLabel: "Tobias",
    def: {
      title: "7 noites de leitura",
      result: "Ler 30 min em 7 noites sem tela na cama.",
      why: "Encerrar o dia com calma e constância.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Hábito noturno",
          objective: "7 sessões de leitura",
          missions: [
            {
              title: "Noites de leitura",
              why: "30 min · livro físico · celular longe",
              weekdays: [],
              time_of_day: "21:30",
              planned_minutes: 40,
              steps: Array.from({ length: 7 }, (_, i) => {
                const n = i + 1;
                return [
                  {
                    surface: `Noite ${n}: livro e luz prontos`,
                    detail: null,
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
              }).flat(),
            },
          ],
        },
      ],
    },
  },
  {
    id: "digital-detox-week",
    title: "Semana sem scroll infinito",
    blurb:
      "Nada de feed infinito por 7 dias. Quando a vontade bater: 20 min de movimento ou leitura.",
    difficulty: "medium",
    primary_stat: "vitality",
    tags: ["foco", "digital", "evitar"],
    scheduleHint: "Diário · check noturno",
    authorLabel: "Tobias",
    def: {
      title: "Semana sem scroll infinito",
      result: "7 dias sem abrir feed infinito (Reels/Shorts/TikTok/etc).",
      why: "O scroll vazio come o dia — recupere atenção e energia.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Sete dias limpos",
          objective: "Check diário + substituição",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — sem feed`,
              why: "Evitar scroll · substituir",
              time: "21:00",
              minutes: 25,
              steps: [
                {
                  surface: `D${i + 1}: apps fora da home / bloqueio`,
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: vontade? 20 min de substituição`,
                  detail: "Caminhada, corda, leitura ou alongamento",
                  planned_minutes: 20,
                },
                {
                  surface: `D${i + 1}: check noturno — consegui?`,
                  detail: "Honestidade no Tobias",
                  planned_minutes: 5,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "rope-skip-challenge",
    title: "Desafio corda — 7 dias",
    blurb:
      "Pular corda todo dia: começa em 5 min e sobe. Agilidade, cardio e bom humor com pouco espaço.",
    difficulty: "medium",
    primary_stat: "agility",
    tags: ["cardio", "casa", "desafio"],
    scheduleHint: "Diário · ~15–25 min",
    authorLabel: "Tobias",
    acceptBonusXp: 45,
    acceptBonusAttr: 4,
    def: {
      title: "Desafio corda — 7 dias",
      result: "7 sessões de corda, progressão de volume.",
      why: "Cardio barato, rápido e viciante.",
      primary_stat: "agility",
      chapters: [
        {
          title: "Cap. 1 — Ritmo na corda",
          objective: "Não quebrar a sequência",
          missions: weekOfDayMissions((day, i) => {
            const jumpMin = Math.min(15, 5 + i * 2);
            return dayMission({
              day,
              i,
              title: `Dia ${i + 1} — corda ${jumpMin} min`,
              why: "Aquecer · pular · registrar",
              time: "07:30",
              minutes: jumpMin + 10,
              steps: [
                {
                  surface: `D${i + 1}: aquecer joelhos/tornozelo`,
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: pular corda ${jumpMin} min`,
                  detail: "Pode fazer rounds de 1–2 min com pausa curta",
                  planned_minutes: jumpMin,
                },
                {
                  surface: `D${i + 1}: alongar + registrar`,
                  detail: null,
                  planned_minutes: 5,
                },
              ],
            });
          }),
        },
      ],
    },
  },
  {
    id: "deep-work-90",
    title: "Deep work — bloco de 90",
    blurb:
      "Cinco dias úteis com um bloco sagrado de 90 min: uma tarefa importante, zero aba extra, timer ligado.",
    difficulty: "medium",
    primary_stat: "inteligence",
    tags: ["foco", "trabalho", "produtividade"],
    scheduleHint: "Seg–sex · 09:00 · 90 min",
    authorLabel: "Tobias",
    acceptBonusXp: 50,
    acceptBonusAttr: 4,
    def: {
      title: "Deep work — bloco de 90",
      result: "5 blocos profundos de 90 min em uma semana útil.",
      why: "Resultado real vem de foco contínuo, não de multitarefa.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Semana de foco",
          objective: "Um bloco sério por dia útil",
          missions: ["seg", "ter", "qua", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — deep work`,
              why: "90 min · uma tarefa · sem Slack/feed",
              time: "09:00",
              minutes: 100,
              steps: [
                {
                  surface: `D${i + 1}: escolher UMA tarefa`,
                  detail: "Escreva no Tobias antes de começar",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: silenciar notificações`,
                  detail: "Celular em outro cômodo se puder",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: bloco 90 min`,
                  detail: "Timer ligado. Pausa só se emergência.",
                  planned_minutes: 90,
                },
                {
                  surface: `D${i + 1}: anotar o que saiu`,
                  detail: "1–3 linhas no Tobias",
                  planned_minutes: 5,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "cold-start-mornings",
    title: "Manhãs de herói",
    blurb:
      "Sete dias acordando e fazendo a trinca: água, movimento leve e 10 min de silêncio/planejamento. Sem celular na cama.",
    difficulty: "easy",
    primary_stat: "vitality",
    tags: ["manhã", "rotina", "energia"],
    scheduleHint: "Diário · 15–25 min ao acordar",
    authorLabel: "Tobias",
    acceptBonusXp: 30,
    acceptBonusAttr: 3,
    def: {
      title: "Manhãs de herói",
      result: "7 manhãs sem celular na cama + ritual curto.",
      why: "Como você começa o dia costuma ditar o restante.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Despertar com intenção",
          objective: "Ritual mínimo 7×",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — manhã`,
              why: "Água · movimento · plano",
              time: "06:45",
              minutes: 25,
              steps: [
                {
                  surface: `D${i + 1}: sair da cama sem abrir feed`,
                  detail: "Celular longe da cabeceira",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: água + alongar/caminhar 8–10 min`,
                  detail: null,
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: 10 min — o que importa hoje?`,
                  detail: "Anote 1 prioridade no Tobias",
                  planned_minutes: 10,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "code-kata-week",
    title: "Code kata da semana",
    blurb:
      "Cinco dias: 45–60 min de código deliberado (kata, bug fix, feature pequena). Sem abrir redes no meio.",
    difficulty: "medium",
    primary_stat: "inteligence",
    tags: ["programação", "prática", "craft"],
    scheduleHint: "Seg–sex · ~60 min",
    authorLabel: "Tobias",
    acceptBonusXp: 55,
    acceptBonusAttr: 4,
    def: {
      title: "Code kata da semana",
      result: "5 sessões de prática deliberada de código.",
      why: "Consistência bate binge de 8 horas uma vez por mês.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Cinco katas",
          objective: "Uma sessão útil por dia útil",
          missions: ["seg", "ter", "qua", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — sessão de código`,
              why: "Escopo pequeno · timer · commit ou nota",
              time: "10:00",
              minutes: 65,
              steps: [
                {
                  surface: `D${i + 1}: definir o desafio (1 frase)`,
                  detail: "Ex.: kata X, corrigir bug Y, ponto Z da feature",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: codar 45–55 min`,
                  detail: "Sem Slack/redes. Anotar dúvidas.",
                  planned_minutes: 50,
                },
                {
                  surface: `D${i + 1}: commit / resumo no Tobias`,
                  detail: null,
                  planned_minutes: 10,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "cook-real-meals",
    title: "5 refeições de verdade",
    blurb:
      "Cinco refeições feitas por você (não delivery). Planeje, compre, cozinhe, coma sem scroll.",
    difficulty: "easy",
    primary_stat: "vitality",
    tags: ["comida", "casa", "saúde"],
    scheduleHint: "5× na semana · ~45–75 min",
    authorLabel: "Tobias",
    acceptBonusXp: 35,
    acceptBonusAttr: 3,
    def: {
      title: "5 refeições de verdade",
      result: "Cozinhar e comer 5 refeições caseiras.",
      why: "Comida real alimenta corpo e senso de controle.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Fogão ligado",
          objective: "5 pratos feitos por você",
          missions: [
            {
              title: "Lista + compra (1×)",
              why: "Sem ingredientes = falha antecipada",
              weekdays: ["seg"],
              time_of_day: "18:00",
              planned_minutes: 60,
              steps: [
                {
                  surface: "Montar cardápio de 5 refeições",
                  detail: "Simples: ovo, arroz, legumes, proteína",
                  planned_minutes: 20,
                },
                {
                  surface: "Comprar / organizar a cozinha",
                  detail: null,
                  planned_minutes: 40,
                },
              ],
            },
            ...["ter", "qua", "qui", "sex", "sab"].map((day, i) =>
              dayMission({
                day,
                i: i + 1,
                title: `Refeição ${i + 1}`,
                why: "Preparar · comer · limpar o básico",
                time: "19:00",
                minutes: 60,
                steps: [
                  {
                    surface: `R${i + 1}: preparar e cozinhar`,
                    detail: "Sem delivery. Receita livre.",
                    planned_minutes: 40,
                  },
                  {
                    surface: `R${i + 1}: comer sem feed`,
                    detail: "Mesa ou bancada, celular longe",
                    planned_minutes: 15,
                  },
                  {
                    surface: `R${i + 1}: louça mínima + Tobias`,
                    detail: null,
                    planned_minutes: 5,
                  },
                ],
              })
            ),
          ],
        },
      ],
    },
  },
  {
    id: "money-guard-week",
    title: "Guardião do dinheiro — 7 dias",
    blurb:
      "Uma semana sem gasto por impulso. Cada vontade vira um registro: queria / por quê / esperei 24h.",
    difficulty: "medium",
    primary_stat: "inteligence",
    tags: ["finanças", "disciplina", "evitar"],
    scheduleHint: "Diário · check 21:00",
    authorLabel: "Tobias",
    acceptBonusXp: 40,
    acceptBonusAttr: 3,
    def: {
      title: "Guardião do dinheiro — 7 dias",
      result: "7 dias sem compra por impulso (só essencial planejado).",
      why: "Dinheiro some no automático — traga consciência.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Semana consciente",
          objective: "Check diário + lista de impulsos",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — sem impulso`,
              why: "Só essencial · registrar desejos",
              time: "21:00",
              minutes: 20,
              steps: [
                {
                  surface: `D${i + 1}: revisar gastos do dia`,
                  detail: "Foi planejado ou impulso?",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: anotar vontades adiadas`,
                  detail: "Nome do item + motivo. Espere 24h.",
                  planned_minutes: 10,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "sprint-intervals",
    title: "Tiros curtos — agilidade",
    blurb:
      "Quatro sessões de tiros: aquecer, 6–8 sprints curtos, voltar andando. Pouco tempo, muita intensidade.",
    difficulty: "hard",
    primary_stat: "agility",
    tags: ["corrida", "HIIT", "desafio"],
    scheduleHint: "4× na semana · ~30 min",
    authorLabel: "Tobias",
    acceptBonusXp: 55,
    acceptBonusAttr: 5,
    def: {
      title: "Tiros curtos — agilidade",
      result: "4 sessões de sprints com aquecimento e volta à calma.",
      why: "Agilidade e VO2 sem precisar de 10 km todo dia.",
      primary_stat: "agility",
      chapters: [
        {
          title: "Cap. 1 — Quatro tiros",
          objective: "Completar as 4 sessões",
          missions: ["seg", "ter", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Sessão ${i + 1} — sprints`,
              why: "Aquecer · tiros · esfriar",
              time: "07:00",
              minutes: 35,
              steps: [
                {
                  surface: `S${i + 1}: aquecer 8–10 min`,
                  detail: "Trote leve + mobilidade",
                  planned_minutes: 10,
                },
                {
                  surface: `S${i + 1}: 6–8 tiros de 20–40 s`,
                  detail: "Recuperação andando entre tiros",
                  planned_minutes: 18,
                },
                {
                  surface: `S${i + 1}: voltar andando + registrar`,
                  detail: null,
                  planned_minutes: 7,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "create-something",
    title: "Crie algo — 5 noites",
    blurb:
      "Escrita, desenho, música ou edição: 40 min criando sem consumir conteúdo. Volume > perfeição.",
    difficulty: "easy",
    primary_stat: "inteligence",
    tags: ["criatividade", "noite", "portfolio"],
    scheduleHint: "5 noites · ~45 min",
    authorLabel: "Tobias",
    acceptBonusXp: 35,
    acceptBonusAttr: 3,
    def: {
      title: "Crie algo — 5 noites",
      result: "5 sessões criativas de ~40 min.",
      why: "Consumir é fácil. Criar é quem você vira.",
      primary_stat: "inteligence",
      chapters: [
        {
          title: "Cap. 1 — Cinco sessões",
          objective: "Produzir um pouco, todos os dias escolhidos",
          missions: ["seg", "ter", "qua", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Noite ${i + 1} — criar`,
              why: "40 min produzindo · zero feed",
              time: "20:30",
              minutes: 50,
              steps: [
                {
                  surface: `N${i + 1}: escolher o meio (texto/som/visual)`,
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: `N${i + 1}: criar 40 min`,
                  detail: "Rascunho permitido. Não apague tudo.",
                  planned_minutes: 40,
                },
                {
                  surface: `N${i + 1}: salvar + 1 linha no Tobias`,
                  detail: "O que saiu?",
                  planned_minutes: 5,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "strength-push-pull",
    title: "Push & Pull em casa",
    blurb:
      "Quatro treinos de força com peso corporal: push, pull, pernas, core. Ideal se academia travou.",
    difficulty: "medium",
    primary_stat: "strength",
    tags: ["treino", "casa", "força"],
    scheduleHint: "4× · ~40–50 min",
    authorLabel: "Tobias",
    acceptBonusXp: 45,
    acceptBonusAttr: 4,
    def: {
      title: "Push & Pull em casa",
      result: "4 sessões de força caseira completas.",
      why: "Manter músculo e hábito sem depender de academia.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Quatro blocos",
          objective: "Push · Pull · Pernas · Core",
          missions: [
            dayMission({
              day: "seg",
              i: 0,
              title: "Push (empurrar)",
              why: "Peito / ombro / tríceps",
              time: "18:00",
              minutes: 45,
              steps: [
                { surface: "Aquecer 5 min", detail: null, planned_minutes: 5 },
                {
                  surface: "Flexões 4× (joelho ok) + elevação ombro",
                  detail: "Até falha técnica perto",
                  planned_minutes: 25,
                },
                {
                  surface: "Tríceps no chão / banco + registrar",
                  detail: null,
                  planned_minutes: 15,
                },
              ],
            }),
            dayMission({
              day: "ter",
              i: 1,
              title: "Pull (puxar)",
              why: "Costas / bíceps — toalha ou barra se tiver",
              time: "18:00",
              minutes: 45,
              steps: [
                { surface: "Aquecer 5 min", detail: null, planned_minutes: 5 },
                {
                  surface: "Remada toalha / australiana 4×",
                  detail: null,
                  planned_minutes: 25,
                },
                {
                  surface: "Rosca (mochila/garrafa) + registrar",
                  detail: null,
                  planned_minutes: 15,
                },
              ],
            }),
            dayMission({
              day: "qui",
              i: 2,
              title: "Pernas",
              why: "Agachamento · afundo · panturrilha",
              time: "18:00",
              minutes: 45,
              steps: [
                { surface: "Aquecer quadril 5 min", detail: null, planned_minutes: 5 },
                {
                  surface: "Agachamento + afundo 4×",
                  detail: null,
                  planned_minutes: 30,
                },
                {
                  surface: "Panturrilha + registrar",
                  detail: null,
                  planned_minutes: 10,
                },
              ],
            }),
            dayMission({
              day: "sex",
              i: 3,
              title: "Core + estabilidade",
              why: "Prancha · dead bug · bird dog",
              time: "18:00",
              minutes: 35,
              steps: [
                { surface: "Mobilidade 5 min", detail: null, planned_minutes: 5 },
                {
                  surface: "Circuito core 20–25 min",
                  detail: "3–4 rounds, descanso curto",
                  planned_minutes: 25,
                },
                {
                  surface: "Registrar sensação",
                  detail: null,
                  planned_minutes: 5,
                },
              ],
            }),
          ],
        },
      ],
    },
  },
  {
    id: "baki-champion",
    title: "Protocolo Baki — o campeão",
    blurb:
      "Todo dia: 4× hang/grip 40s · 4× prancha 60s · 100 abdominais · 10 min sombra · 20 min farmer walk (mochila/sacolas). Protocolo fechado — só executar.",
    difficulty: "hard",
    primary_stat: "strength",
    tags: ["anime", "baki", "luta", "força"],
    scheduleHint: "Diário · ~55–65 min",
    authorLabel: "Tobias",
    acceptBonusXp: 75,
    acceptBonusAttr: 6,
    def: {
      title: "Protocolo Baki — o campeão",
      result:
        "7 dias: grip 4×40s · prancha 4×60s · 100 abs · 10 min sombra · 20 min farmer walk.",
      why: "Força de lutador underground — números claros, zero improviso.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Semana no subsolo",
          objective: "Cumprir o protocolo completo cada dia",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — protocolo Baki`,
              why: "Grip 4×40s · prancha 4×60s · 100 abs · sombra 10 · farmer 20",
              time: "07:00",
              minutes: 60,
              steps: [
                {
                  surface: `D${i + 1}: aquecer 5 min`,
                  detail: "Círculos de ombro, braço e pescoço LEVE (sem carga no pescoço)",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: grip 4×40 s`,
                  detail:
                    "Barra (hang) OU apertar toalha enrolada OU hand gripper. Descanso 60–90 s entre séries. Se falhar antes dos 40 s, anote e complete o restante em 2ª tentativa.",
                  planned_minutes: 12,
                },
                {
                  surface: `D${i + 1}: prancha 4×60 s`,
                  detail:
                    "Corpo reto, cotovelos sob ombros. Joelho no chão só se quebrar a forma. Descanso 45 s.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: 100 abdominais`,
                  detail:
                    "Quebre como quiser (ex.: 10×10 ou 5×20). Opções: crunch, sit-up ou hollow rock. Pare se lombar doer.",
                  planned_minutes: 12,
                },
                {
                  surface: `D${i + 1}: sombra de luta 10 min`,
                  detail:
                    "Timer: 5 rounds de 2 min. Cada round: jab-direto-hook-upper + deslocamento lateral. Sem pausa longa entre rounds (30 s).",
                  planned_minutes: 12,
                },
                {
                  surface: `D${i + 1}: farmer walk 20 min`,
                  detail:
                    "Mochila com livros/água OU 2 sacolas pesadas. Ande sem parar (pode trocar de mão). Meta: 20 min contínuos.",
                  planned_minutes: 20,
                },
                {
                  surface: `D${i + 1}: registrar no Tobias`,
                  detail: "Marque se cumpriu cada bloco (sim/não)",
                  planned_minutes: 3,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "ippo-roadwork",
    title: "Roadwork do Ippo",
    blurb:
      "6 dias: 5 km de trote (ou 30 min) · 3 rounds de sombra 3 min · 200 cordas · 50 flexões. Roadwork de boxeador de verdade.",
    difficulty: "medium",
    primary_stat: "agility",
    tags: ["anime", "boxe", "ippo", "cardio"],
    scheduleHint: "Seg–sáb · ~50–60 min",
    authorLabel: "Tobias",
    acceptBonusXp: 50,
    acceptBonusAttr: 4,
    def: {
      title: "Roadwork do Ippo",
      result: "6 dias: 5 km (ou 30 min) · 3×3 min sombra · 200 cordas · 50 flexões.",
      why: "Base de boxeador: estrada + sombra + corda + volume de flexões.",
      primary_stat: "agility",
      chapters: [
        {
          title: "Cap. 1 — Estrada do Kamogawa",
          objective: "Completar o protocolo Ippo 6×",
          missions: ["seg", "ter", "qua", "qui", "sex", "sab"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — roadwork Ippo`,
              why: "5 km · 3×3 min sombra · 200 cordas · 50 flexões",
              time: "06:30",
              minutes: 55,
              steps: [
                {
                  surface: `D${i + 1}: aquecer 5 min`,
                  detail: "Trote no lugar + mobilidade de ombro e quadril",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: roadwork 5 km (ou 30 min)`,
                  detail:
                    "Trote contínuo. Se não fizer 5 km ainda: 30 min sem parar, ritmo de conversa. Sem sprint.",
                  planned_minutes: 30,
                },
                {
                  surface: `D${i + 1}: sombra 3 rounds × 3 min`,
                  detail:
                    "Round 1: só jab + deslocamento. Round 2: jab-direto. Round 3: jab-direto-hook. Descanso 60 s entre rounds.",
                  planned_minutes: 12,
                },
                {
                  surface: `D${i + 1}: 200 saltos de corda`,
                  detail:
                    "Pode quebrar (ex.: 4×50). Se não tiver corda: 200 saltos no lugar com braços girando.",
                  planned_minutes: 8,
                },
                {
                  surface: `D${i + 1}: 50 flexões`,
                  detail: "Quebre em séries (ex.: 5×10). Joelho permitido se forma falhar.",
                  planned_minutes: 8,
                },
                {
                  surface: `D${i + 1}: alongar panturrilha 3 min + Tobias`,
                  detail: null,
                  planned_minutes: 3,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "rock-lee-gates",
    title: "Treino do Rock Lee",
    blurb:
      "Todo dia: 8 km (ou 45 min) de corrida · 200 flexões · 200 agachamentos · 10 min alongamento (splits assistidos). Taijutsu sem atalho.",
    difficulty: "hard",
    primary_stat: "agility",
    tags: ["anime", "naruto", "taijutsu", "disciplina"],
    scheduleHint: "Diário · ~70–90 min",
    authorLabel: "Tobias",
    acceptBonusXp: 70,
    acceptBonusAttr: 5,
    def: {
      title: "Treino do Rock Lee",
      result: "7 dias: 8 km/45 min · 200 flexões · 200 agachamentos · 10 min alongar.",
      why: "Trabalho duro com números — como o Lee, sem jutsu.",
      primary_stat: "agility",
      chapters: [
        {
          title: "Cap. 1 — Taijutsu diário",
          objective: "Cumprir volume Lee cada dia",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — protocolo Lee`,
              why: "8 km · 200 flexões · 200 agachamentos · 10 min alongar",
              time: "06:00",
              minutes: 80,
              steps: [
                {
                  surface: `D${i + 1}: corrida 8 km (ou 45 min)`,
                  detail:
                    "Ritmo constante. Iniciante: 45 min sem parar. Intermediário: tente distância.",
                  planned_minutes: 45,
                },
                {
                  surface: `D${i + 1}: 200 flexões`,
                  detail:
                    "Obrigatório completar 200. Quebre (ex.: 20×10 ou 10×20). Joelho ok. Anote quantas séries usou.",
                  planned_minutes: 20,
                },
                {
                  surface: `D${i + 1}: 200 agachamentos`,
                  detail:
                    "Profundidade que controla. Quebre igual às flexões. Sem salto se joelho reclamar.",
                  planned_minutes: 18,
                },
                {
                  surface: `D${i + 1}: alongamento 10 min`,
                  detail:
                    "2 min isquiotibiais · 2 min quadríceps · 2 min adductores (abrir pernas) · 2 min ombros · 2 min respiração profunda. Segure cada pose 30–40 s.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: registrar no Tobias`,
                  detail: "Flexões e agachamentos concluídos? (sim/não)",
                  planned_minutes: 2,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "plus-ultra",
    title: "Plus Ultra — All Might",
    blurb:
      "5 dias com ficha fixa: Seg push · Ter pull · Qua pernas · Qui push · Sex pull. Cada dia: 4 exercícios × 4 séries × 8–12 reps + 1 série Plus Ultra (falha técnica).",
    difficulty: "medium",
    primary_stat: "strength",
    tags: ["anime", "boku-no-hero", "força", "progressão"],
    scheduleHint: "Seg–sex · ~50 min",
    authorLabel: "Tobias",
    acceptBonusXp: 55,
    acceptBonusAttr: 4,
    def: {
      title: "Plus Ultra — All Might",
      result: "5 treinos ABC caseiros com série final Plus Ultra.",
      why: "Ficha clara + um set além do confortável — sem lesão.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Cinco dias de herói",
          objective: "Completar a ficha de cada dia + série Plus Ultra",
          missions: [
            dayMission({
              day: "seg",
              i: 0,
              title: "Seg — Push (empurrar)",
              why: "Flexão · piso diamante · elevação lateral · tríceps",
              time: "18:00",
              minutes: 50,
              steps: [
                {
                  surface: "Aquecer 5 min",
                  detail: "Polichinelo 2 min + círculos de ombro 3 min",
                  planned_minutes: 5,
                },
                {
                  surface: "Flexões 4×8–12",
                  detail: "Descanso 90 s. Joelho se precisar manter a forma.",
                  planned_minutes: 12,
                },
                {
                  surface: "Flexão diamante OU tríceps banco 4×8–12",
                  detail: "Descanso 90 s",
                  planned_minutes: 10,
                },
                {
                  surface: "Elevação lateral (garrafas/mochila) 4×12",
                  detail: "Descanso 60 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Tríceps no chão 4×10–12",
                  detail: "Descanso 60 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Plus Ultra: 1 série de flexões até falha técnica",
                  detail: "Pare quando a forma quebrar — não quando doer o ego.",
                  planned_minutes: 5,
                },
                {
                  surface: "Registrar cargas/reps no Tobias",
                  detail: null,
                  planned_minutes: 2,
                },
              ],
            }),
            dayMission({
              day: "ter",
              i: 1,
              title: "Ter — Pull (puxar)",
              why: "Remada · australiana · rosca · prancha",
              time: "18:00",
              minutes: 50,
              steps: [
                {
                  surface: "Aquecer 5 min",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Remada com toalha/mochila 4×10–12",
                  detail:
                    "Toalha na porta OU remada curvada com mochila. Descanso 90 s.",
                  planned_minutes: 12,
                },
                {
                  surface: "Australiana OU inverted row 4×6–10",
                  detail: "Mesa firme / barra baixa. Descanso 90 s.",
                  planned_minutes: 10,
                },
                {
                  surface: "Rosca (garrafa/mochila) 4×10–12",
                  detail: "Descanso 60 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Prancha 4×45 s",
                  detail: "Descanso 45 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Plus Ultra: 1 série de remada até falha técnica",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Registrar no Tobias",
                  detail: null,
                  planned_minutes: 2,
                },
              ],
            }),
            dayMission({
              day: "qua",
              i: 2,
              title: "Qua — Pernas",
              why: "Agachamento · afundo · panturrilha · glúteo",
              time: "18:00",
              minutes: 50,
              steps: [
                {
                  surface: "Aquecer quadril 5 min",
                  detail: "Agachamento sem carga ×15 + mobilidade",
                  planned_minutes: 5,
                },
                {
                  surface: "Agachamento 4×10–15",
                  detail: "Pés na largura do ombro. Descanso 90 s.",
                  planned_minutes: 12,
                },
                {
                  surface: "Afundo alternado 4×8–10/perna",
                  detail: "Descanso 90 s",
                  planned_minutes: 12,
                },
                {
                  surface: "Panturrilha em pé 4×15–20",
                  detail: "Descanso 45 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Ponte de glúteo 4×12–15",
                  detail: "Descanso 60 s",
                  planned_minutes: 8,
                },
                {
                  surface: "Plus Ultra: 1 série de agachamento até falha técnica",
                  detail: null,
                  planned_minutes: 4,
                },
                {
                  surface: "Registrar no Tobias",
                  detail: null,
                  planned_minutes: 2,
                },
              ],
            }),
            dayMission({
              day: "qui",
              i: 3,
              title: "Qui — Push (empurrar)",
              why: "Mesma ficha de segunda",
              time: "18:00",
              minutes: 50,
              steps: [
                {
                  surface: "Aquecer 5 min",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Flexões 4×8–12",
                  detail: "Tente +1 rep vs segunda se possível",
                  planned_minutes: 12,
                },
                {
                  surface: "Flexão diamante OU tríceps banco 4×8–12",
                  detail: null,
                  planned_minutes: 10,
                },
                {
                  surface: "Elevação lateral 4×12",
                  detail: null,
                  planned_minutes: 8,
                },
                {
                  surface: "Tríceps no chão 4×10–12",
                  detail: null,
                  planned_minutes: 8,
                },
                {
                  surface: "Plus Ultra: flexões até falha técnica",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Registrar no Tobias",
                  detail: null,
                  planned_minutes: 2,
                },
              ],
            }),
            dayMission({
              day: "sex",
              i: 4,
              title: "Sex — Pull (puxar)",
              why: "Mesma ficha de terça",
              time: "18:00",
              minutes: 50,
              steps: [
                {
                  surface: "Aquecer 5 min",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Remada 4×10–12",
                  detail: null,
                  planned_minutes: 12,
                },
                {
                  surface: "Australiana 4×6–10",
                  detail: null,
                  planned_minutes: 10,
                },
                {
                  surface: "Rosca 4×10–12",
                  detail: null,
                  planned_minutes: 8,
                },
                {
                  surface: "Prancha 4×45 s",
                  detail: null,
                  planned_minutes: 8,
                },
                {
                  surface: "Plus Ultra: remada até falha técnica",
                  detail: null,
                  planned_minutes: 5,
                },
                {
                  surface: "Registrar no Tobias",
                  detail: null,
                  planned_minutes: 2,
                },
              ],
            }),
          ],
        },
      ],
    },
  },
  {
    id: "total-concentration",
    title: "Respiração Total — Hashira",
    blurb:
      "Todo dia: 40 ciclos de respiração 4-2-6 · 10 min mobilidade (lista fixa) · 2000 passos rápidos OU 15 min corda. Sem “tanto faz”.",
    difficulty: "easy",
    primary_stat: "vitality",
    tags: ["anime", "kimetsu", "respiração", "foco"],
    scheduleHint: "Diário · ~35–40 min",
    authorLabel: "Tobias",
    acceptBonusXp: 35,
    acceptBonusAttr: 3,
    def: {
      title: "Respiração Total — Hashira",
      result: "7 dias: 40 ciclos 4-2-6 · 10 min mobilidade · 2000 passos/15 min corda.",
      why: "Concentração Total com protocolo fechado.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Respiração Total",
          objective: "Executar a sequência completa cada dia",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — Concentração Total`,
              why: "40× respiração · 10 min mobilidade · 2000 passos/corda",
              time: "07:00",
              minutes: 38,
              steps: [
                {
                  surface: `D${i + 1}: 40 ciclos respiração 4-2-6`,
                  detail:
                    "Sentado ou em pé: inspira nariz 4 s · segura 2 s · solta boca 6 s. Conte até 40. Se perder a conta, recomece do ciclo atual.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: mobilidade 10 min (fixa)`,
                  detail:
                    "2 min círculo de ombro · 2 min gato-vaca · 2 min lunges de quadril · 2 min rotação torácica · 2 min panturrilha na parede.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: 2000 passos rápidos OU 15 min corda`,
                  detail:
                    "Escolha UMA: caminhada acelerada até ~2000 passos (celular/relógio) OU corda contínua 15 min (pode pausar 30 s a cada 2 min).",
                  planned_minutes: 15,
                },
                {
                  surface: `D${i + 1}: 1 min de respiração final + Tobias`,
                  detail: "3 ciclos lentos e registrar",
                  planned_minutes: 3,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "goku-morning-gravity",
    title: "Treino sob “gravidade” — Goku",
    blurb:
      "5 manhãs com mochila ~5–10 kg: 5 rounds de (20 agachamentos · 15 flexões · 20 remadas · 30 s prancha · 40 polichinelos). Depois 10 min trote.",
    difficulty: "hard",
    primary_stat: "strength",
    tags: ["anime", "dragon-ball", "circuito", "manhã"],
    scheduleHint: "Seg–sex · ~50–55 min",
    authorLabel: "Tobias",
    acceptBonusXp: 65,
    acceptBonusAttr: 5,
    def: {
      title: "Treino sob “gravidade” — Goku",
      result: "5 circuitos: 5 rounds com carga + 10 min trote.",
      why: "Gravidade = mochila. Números fixos. Sem inventar no meio.",
      primary_stat: "strength",
      chapters: [
        {
          title: "Cap. 1 — Câmara leve",
          objective: "5 rounds completos + trote cada manhã",
          missions: ["seg", "ter", "qua", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — gravidade 10×`,
              why: "5 rounds (20/15/20/30s/40) + 10 min trote",
              time: "06:30",
              minutes: 55,
              steps: [
                {
                  surface: `D${i + 1}: montar mochila 5–10 kg + aquecer 5 min`,
                  detail: "Livros/água. Comece leve se for seu 1º circuito.",
                  planned_minutes: 5,
                },
                {
                  surface: `D${i + 1}: round 1/5 — protocolo`,
                  detail:
                    "20 agachamentos · 15 flexões · 20 remadas (toalha/mochila) · 30 s prancha · 40 polichinelos. Descanso até 60 s só se precisar.",
                  planned_minutes: 7,
                },
                {
                  surface: `D${i + 1}: round 2/5 — mesmo protocolo`,
                  detail: "Mesmos números. Mochila vestida o tempo todo.",
                  planned_minutes: 7,
                },
                {
                  surface: `D${i + 1}: round 3/5 — mesmo protocolo`,
                  detail: null,
                  planned_minutes: 7,
                },
                {
                  surface: `D${i + 1}: round 4/5 — mesmo protocolo`,
                  detail: null,
                  planned_minutes: 7,
                },
                {
                  surface: `D${i + 1}: round 5/5 — mesmo protocolo`,
                  detail: "Último round: sem desistir no meio.",
                  planned_minutes: 7,
                },
                {
                  surface: `D${i + 1}: trote 10 min (sem mochila)`,
                  detail: "Ritmo de conversa. Pode ser esteira ou rua.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: registrar rounds concluídos`,
                  detail: "Quantos rounds completos? Meta = 5.",
                  planned_minutes: 2,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "haikyuu-legs",
    title: "Salto do Karasuno",
    blurb:
      "4 sessões: 3×10 elevação de panturrilha · 4×8 saltos verticais · 4×6 saltos laterais · 3×20 pezinho · 3×40 s prancha. Ficha de quadra.",
    difficulty: "medium",
    primary_stat: "agility",
    tags: ["anime", "haikyuu", "salto", "pernas"],
    scheduleHint: "Seg · Ter · Qui · Sex · ~40 min",
    authorLabel: "Tobias",
    acceptBonusXp: 45,
    acceptBonusAttr: 4,
    def: {
      title: "Salto do Karasuno",
      result: "4 sessões com volume de salto e agilidade definidos.",
      why: "Bloqueio e ataque começam em números no chão.",
      primary_stat: "agility",
      chapters: [
        {
          title: "Cap. 1 — Quatro sets",
          objective: "Completar a ficha Karasuno 4×",
          missions: ["seg", "ter", "qui", "sex"].map((day, i) =>
            dayMission({
              day,
              i,
              title: `Sessão ${i + 1} — Karasuno`,
              why: "Panturrilha · saltos · pezinho · prancha",
              time: "17:30",
              minutes: 42,
              steps: [
                {
                  surface: `S${i + 1}: aquecer 5 min`,
                  detail: "2 min corda/polichinelo + 20 agachamentos sem carga + mobilidade tornozelo",
                  planned_minutes: 5,
                },
                {
                  surface: `S${i + 1}: panturrilha 3×15`,
                  detail: "Em pé, subida completa. Descanso 45 s. Pode usar 1 perna se fácil demais.",
                  planned_minutes: 6,
                },
                {
                  surface: `S${i + 1}: salto vertical 4×8`,
                  detail:
                    "Abaixou-explodiu-aterrizou macio. Descanso 60–90 s. Sem altura máxima se joelho doer — foque na qualidade.",
                  planned_minutes: 10,
                },
                {
                  surface: `S${i + 1}: salto lateral 4×6/lado`,
                  detail: "Linha no chão. Descanso 60 s.",
                  planned_minutes: 8,
                },
                {
                  surface: `S${i + 1}: pezinho 3×20 s`,
                  detail:
                    "Pés rápidos no lugar (ou escada imaginária). Descanso 40 s. Intensidade alta, amplitude curta.",
                  planned_minutes: 5,
                },
                {
                  surface: `S${i + 1}: prancha 3×40 s`,
                  detail: "Descanso 40 s",
                  planned_minutes: 5,
                },
                {
                  surface: `S${i + 1}: registrar no Tobias`,
                  detail: "Saltos concluídos sem dor? (sim/não)",
                  planned_minutes: 2,
                },
              ],
            })
          ),
        },
      ],
    },
  },
  {
    id: "thorfinn-stillness",
    title: "Fazenda de Thorfinn",
    blurb:
      "Todo dia: 40 min de caminhada sem fone · 20 min de trabalho manual útil (lista) · 10 min sentado em silêncio (timer). Protocolo de presença.",
    difficulty: "easy",
    primary_stat: "vitality",
    tags: ["anime", "vinland", "calma", "caminhada"],
    scheduleHint: "Diário · 70 min",
    authorLabel: "Tobias",
    acceptBonusXp: 30,
    acceptBonusAttr: 3,
    def: {
      title: "Fazenda de Thorfinn",
      result: "7 dias: 40 min caminhada · 20 min trabalho · 10 min silêncio.",
      why: "Números quietos — cultivando o caminho, não a raiva.",
      primary_stat: "vitality",
      chapters: [
        {
          title: "Cap. 1 — Semana na terra",
          objective: "Cumprir os 3 blocos fixos cada dia",
          missions: weekOfDayMissions((day, i) =>
            dayMission({
              day,
              i,
              title: `Dia ${i + 1} — fazenda`,
              why: "40 min caminhar · 20 min trabalho · 10 min silêncio",
              time: "08:00",
              minutes: 70,
              steps: [
                {
                  surface: `D${i + 1}: caminhada 40 min sem fone/feed`,
                  detail:
                    "Timer ligado. Rua, parque ou esteira. Proibido podcast/música/redes. Só passos.",
                  planned_minutes: 40,
                },
                {
                  surface: `D${i + 1}: trabalho manual 20 min`,
                  detail:
                    "Escolha UMA e complete o bloco: louça + limpar pia · dobrar/organizar roupa · varrer · cuidar de planta · consertar algo simples. Mãos no trabalho real.",
                  planned_minutes: 20,
                },
                {
                  surface: `D${i + 1}: silêncio 10 min (timer)`,
                  detail:
                    "Sentado, celular em outro cômodo. Olhos abertos ou fechados. Se a mente divagar, volte à respiração — sem julgar.",
                  planned_minutes: 10,
                },
                {
                  surface: `D${i + 1}: registrar no Tobias`,
                  detail: "Os 3 blocos feitos? (sim/não)",
                  planned_minutes: 2,
                },
              ],
            })
          ),
        },
      ],
    },
  },
];

export const OFFICIAL_CAMPAIGN_TEMPLATES = RAW_TEMPLATES.map(withRewards);

export function getOfficialTemplateById(id) {
  return OFFICIAL_CAMPAIGN_TEMPLATES.find((t) => t.id === id) || null;
}

export function listOfficialTemplateCards() {
  return OFFICIAL_CAMPAIGN_TEMPLATES.map((t) => ({
    id: t.id,
    title: t.title,
    blurb: t.blurb,
    difficulty: t.difficulty,
    primary_stat: t.primary_stat,
    primary_stat_label: t.primary_stat_label,
    tags: t.tags,
    scheduleHint: t.scheduleHint,
    authorLabel: t.authorLabel,
    acceptBonusXp: t.acceptBonusXp,
    acceptBonusAttr: t.acceptBonusAttr,
    estimatedXp: t.estimatedXp,
  }));
}
