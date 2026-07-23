# Quarentena de features (legado)

Tudo abaixo **continua no código**, mas deve ficar **desativado ou inacessível na UI** durante o MVP da nova visão — salvo o que estiver em **reintrodução Cap.9–13**.

Flags sugeridas: `FEATURE_*` ou rotas no menu do andar Identidade.

**Neste workspace:** cópias do legado para avaliar estão em `refatoracao/` (nomes descritivos). O app ativo em `src/` não importa esses arquivos.

---

## Onde está o código legado

Neste repositório (`Desktop/Tobias`), as cópias para avaliação ficam em **`refatoracao/`**. O projeto original em `programasPC/tobias` **não foi movido nem apagado**.

---

## Desativar / ocultar na navegação (MVP)

| Feature | Onde vive hoje | Motivo |
|---------|----------------|--------|
| Log livre de atividades na home | `ActivitiesIncrease`, home | Centro antigo = “o que logar?”; novo centro = “continuar missão”. |
| Missões diárias aleatórias | `/quests`, cron `daily-quests` | Conflita com caminho ordenado e próximo passo. |
| Desafio mensal + ranking | `/quests` | Competição social; fora do ciclo Identity. |
| Metas numéricas soltas | `/goals` | Métricas sem campanha; substituídas por progresso de capítulo. |
| Loja / TobiasCoins / itens | rotas comentadas, coins no HUD | Economia; ruído. |
| Daystreak como pressão na home | HUD / shield | Não punir pausa de campanha. |
| Frases motivacionais como hero | home quote | Opcional depois; não compete com “Continuar”. |
| Hub antigo de conquistas por categoria de atividade | `/achievements` legado | Substituído por marcos Cap.13. |
| Analytics de humor/cores do calendário | `/analitycs` legado | Substituído por analytics de sessões Cap.11. |

## Em reintrodução (Cap. 9–13) — **reintroduzido**

| Feature | Forma nova | Cap |
|---------|------------|-----|
| Atributos clássicos | Grant via `primary_stat` + WIS derivada; ficha `/profile` — não hub na home | 9 |
| Visibilidade | `private` / `public` em perfil e campanha | 10 |
| Analytics | Dias fortes/fracos de `work_sessions` em `/analytics` | 11 |
| Campeões | Galeria + visita de perfil público (sem ranking) | 12 |
| Conquistas | Marcos do motor + pins (máx. 3) no perfil | 13 |

## Manter por baixo dos panos (não apagar)

- Auth + sessão + perfil do campeão
- XP / level (já ligado a `completeStep`)
- Schema e services existentes
- Cron endpoints (podem ficar, mas UI não depende deles)

## Ainda em quarentena (não nesta fila)

| Feature | Se fizer sentido como… |
|---------|-------------------------|
| Log de hábitos | Atalho raro, nunca home |
| Quotes | Easter egg / loading |
| Ranking / loja / quests | Só com regras apertadas, pós Identity |

## Critério para sair da quarentena

A feature responde “o que faço agora?”, “onde estou na campanha?” ou (andar Identidade) “quem sou / quem inspira” **sem** competir com a missão ativa na home. Caso contrário, permanece fora.
