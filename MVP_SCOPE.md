# Escopo congelado do MVP

Decisões fechadas em 2026-07-22. Mudanças depois disso = revisão explícita, não “enquanto faz”.

## Objetivo do MVP

Isaac abre o Tobias (PWA no **PC ou no celular**) e vê **uma** ação mastigada para agora, com timer/pomodoro, progresso de campanha visível e sem pressão. Várias frentes de vida existem; o foco imediato é um.

## Entra no MVP

| # | Capacidade |
|---|------------|
| 1 | Várias campanhas (ex.: academia, financeira) |
| 2 | Capítulos → missões → passos (hierarquia da `PROGRESSION_SPEC.md`) |
| 3 | Uma missão principal + próximo passo na home (**Continuar**) |
| 4 | Agenda: dias da semana + duração (+ horário opcional) |
| 5 | Detalhe colapsável no passo (ex.: exercícios) |
| 6 | Sessão com pomodoro/timer e tempo gravado |
| 7 | Pausar / retomar com `resume_note` |
| 8 | PWA instalável (desktop + mobile), UI responsiva |
| 9 | Shell visual dark / adulto / nerd-RPG (nova cara) |
| 10 | Legado fora da visão fora da UI (`refatoracao/` + menu limpo) |

## Não entra no MVP

- IA montando campanhas sozinha
- Ranking, comunidade, loja, quests aleatórias
- Validação externa de execução
- App nativo (Tauri / React Native)
- Reativar XP/atributos como eixo da home (XP pode ser stub depois)
- Notificações push completas
- Offline total

## Ordem de construção (após Cap. 1)

1. **Cap. 2** — Shell visual + PWA + UI já sem legado (quarentena concluída neste repo)
2. **Cap. 3** — Schema + motor Continuar + pomodoro + agenda + multi-campanha
3. **Cap. 4** — Semear academia (ou outra) no app e usar 1 semana de verdade

## Workspace

- **Ativo:** `Desktop/Tobias`
- **Original (intocado):** `programasPC/tobias`
- **Legado para avaliar:** `Desktop/Tobias/refatoracao/`

## Critério de “MVP pronto”

Dá para viver uma semana com pelo menos **duas** campanhas cadastradas, abrir o PWA no telefone ou no PC, executar o passo do dia com timer, pausar sem perder o lugar, e ver progresso de capítulo — sem abrir telas do Tobias antigo.
