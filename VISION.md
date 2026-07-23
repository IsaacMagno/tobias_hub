# Tobias — Visão do Produto

## Propósito

O Tobias é um **guia de progressão pessoal** (PWA para **desktop e celular**): transforma frentes da vida — saúde, finanças, carreira, etc. — em caminhos mastigados, passo a passo, com progresso visível e sem pressão.

Ao abrir (ou instalar na tela inicial / como app), você vê **o que fazer agora**, por quanto tempo, e pode medir a sessão com **pomodoro**. Sem decidir do zero. Sem punição por pausar.

Não é um gerenciador de tarefas com XP. Não é um feed social de hábitos.

## Problema

Metas amplas (“voltar à academia”, “organizar o dinheiro”) não dizem o que fazer às 18h de uma terça. O cérebro cansa de decidir, começa e abandona.

O Tobias antigo resolvia a **recompensa** (XP, atributos). A evolução resolve a **direção** (próximo passo claro), no espírito do Ganymede no Dofus.

## Inspirações

- **Ganymede:** próximo passo óbvio, progresso em etapas, sempre à mão (lá via Tauri; aqui via **PWA instalável** no PC e no celular).
- **Despertadores / Pavlov:** horário como gatilho para uma ação já definida.
- **Tobias original:** feedback RPG (XP, níveis) como consequência — camada secundária no MVP.

## Direção visual

- **Mais adulta**, sóbria, legível em uso diário longo.
- Ainda **nerd / RPG / dark** — atmosfera de grimório ou HUD de campanha, não de app infantil de hábitos nem de Habitica colorido.
- Identidade própria; menos “dashboard genérico zinc + Roboto”.
- Progressão visível **sem forçar**: barras e capítulos informam; não cobram streak agressivo na jornada de campanha.

## Princípios

1. **Próximo passo explícito** — a superfície principal responde “o que faço agora?”.
2. **Tudo mastigado** — dias da semana, duração, e opcionalmente o detalhe (ex.: lista de exercícios). Na hora, só executar.
3. **Progressão, não lista infinita** — toda ação pertence a uma campanha/capítulo.
4. **Opções limitadas** — o que não está desbloqueado fica bloqueado ou desativado.
5. **Uma missão principal por vez** — várias frentes existem; o foco imediato é um.
6. **Pausa sem culpa** — retomar mostra onde parou.
7. **Tempo medido** — pomodoro/sessão ajuda a organizar e a ver quanto tempo foi investido.
8. **Recompensa é consequência** — XP/RPG não mandam no caminho.
9. **Legado em quarentena** — o que não serve à visão fica desativado até avaliarmos refatorar ou remover.

## Modelo mental

```text
Vida
└── Campanha (ex.: Voltar à academia)
    └── Capítulo (ex.: Rotina 2x por semana)
        └── Missão (ex.: Treino de força — Semana 1)
            └── Passo (ex.: Sequência de hoje — já escrita)
                └── Sessão + Pomodoro (cronometra e registra)
```

### Exemplo (academia)

| Nível | Conteúdo |
|-------|----------|
| Campanha | Voltar à academia |
| Capítulo 1 | Retomar o hábito (2x/semana) |
| Missão | Treinos da semana 1 |
| Agenda | Seg e Qui, ~60 min |
| Passos | Ir → aquecer 5 min → bloco A → bloco B → alongar |
| Profundidade opcional | Quais exercícios / séries (só se quiser abrir) |
| Sessão | Pomodoro ou timer da sessão; ao terminar, marcar passo e ver progresso do capítulo |

Na hora H: abrir Tobias → **Continuar** → fazer o que está escrito → ponto.

## Experiência principal (PWA)

1. App instalável no **computador e no celular** (PWA), abrível como app dedicado.
2. Superfície dominante: **missão ativa + passos de hoje + pomodoro/timer**.
3. Progresso da campanha/capítulo visível, sem gritaria.
4. Outras frentes acessíveis em um toque (trocar foco), sem ranking social.
5. Features antigas fora da visão: em `refatoracao/` neste repo (e desativadas na UI), para avaliar depois.

## MVP — o que precisa existir

O MVP é bem-sucedido quando Isaac consegue:

1. Manter **várias campanhas** (saúde, financeira, …) com progresso visível.
2. Ter **uma** missão/passo atual óbvio na abertura do app.
3. Ver **agenda** (dias da semana + duração estimada) no que for recorrente.
4. Opcionalmente abrir **detalhe mastigado** (ex.: exercícios).
5. Rodar **sessão com pomodoro/timer** e registrar tempo gasto.
6. Pausar / retomar sem perder o lugar.
7. Usar o app como **PWA no desktop e no celular**.
8. Não ser distraído por quests aleatórias, ranking, loja, etc. (quarentena).

### Primeira campanha do produto

**Finalizar esta evolução do Tobias** (campanha meta em `campaigns/01-motor-de-campanha.md`).  
Só depois elaboramos as demais campanhas de vida *dentro* do app — a 01 existe para tornar isso possível.

## Fora do MVP (agora)

- IA montando a vida sozinha
- Validação externa / anti-fraude
- Ranking, comunidade, loja, economia complexa
- App nativo (React Native / Tauri) — PWA cobre mobile e desktop no MVP
- Reescrever todo o RPG de hábitos antes do motor de campanha
- Tauri (Ganymede usa Tauri; só se PWA não bastar no desktop)

## Base técnica atual

Workspace ativo: **`Desktop/Tobias`** (Next.js + Supabase + NextAuth).  
Original intocado: `programasPC/tobias`. Legado para avaliar: `refatoracao/`.

Novo núcleo a implementar: campanhas, capítulos, missões, passos, sessões, agenda, pomodoro, PWA, home “Continuar”.

## Documentos relacionados

- `MVP_SCOPE.md` — escopo congelado do MVP
- `IMPLEMENTATION_PLAN.md` — ordem Cap. 2 → 4
- `PROGRESSION_SPEC.md` — estados e regras do motor
- `FEATURE_QUARANTINE.md` — o que ficou de fora
- `campaigns/01-motor-de-campanha.md` — campanha meta (CURSOR)
- `campaigns/_template-vida.md` — template de campanha de vida
- `campaigns/exemplo-voltar-a-academia.md` — exemplo mastigado
