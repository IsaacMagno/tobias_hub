# Tobias — Estado atual do produto

Documento de inventário (jul/2026): o que o app faz hoje, para quem é, e como isso se compara a `VISION.md` e `PROGRESSION_SPEC.md`.

**Stack:** Next.js 14 (App Router) · Supabase · NextAuth · PWA-friendly (shell responsiva)  
**Workspace:** `Desktop/Tobias` · legado em `refatoracao/`

---

## 1. Propósito (resumo)

O Tobias é um **guia de progressão pessoal**: transforma frentes da vida (saúde, finanças, carreira, hábitos…) em caminhos **mastigados** (campanha → capítulo → missão → passo), com uma resposta clara ao abrir o app — **o que faço agora?** — e timer/pomodoro para executar.

Não é gerenciador de tarefas com XP no centro.  
Não é feed social de hábitos.  
Recompensa RPG (XP, atributos) é **consequência**, não o caminho.

---

## 2. Público-alvo

| Perfil | Por quê o Tobias serve |
|--------|-------------------------|
| **Usuário primário (hoje)** | Pessoa que quer progressão pessoal estruturada (ex.: Isaac / early adopters convidados), com tom adulto, nerd/RPG, sem pressão tóxica. |
| **Quem se beneficia** | Quem trava em metas amplas (“voltar à academia”) e precisa de **próximo passo explícito**, agenda leve e pausa sem culpa. |
| **Quem não é o foco** | Quem busca Habitica/competição global, loja, quests aleatórias, validação externa ou IA montando a vida sozinha. |
| **Acesso** | Conta com **código de convite** de alguém que já está no Tobias (crescimento controlado). |

Tom de produto (visão): dark, sóbrio, grimório/HUD de campanha — não app infantil de hábitos.

---

## 3. Modelo mental (inalterado e implementado)

```text
Vida
└── Campanha (frente: academia, finanças…)
    └── Capítulo (fase)
        └── Missão (resultado intermediário + agenda)
            └── Passo (ação concreta: superfície + detalhe opcional)
                └── Sessão + Timer/Pomodoro
```

**Invariante de produto:** no máximo **uma missão em foco** por usuário; várias campanhas podem existir em paralelo.

---

## 4. Mapa de funcionalidades atuais

### 4.1 Núcleo — Continuar (`/`)

- Home dominante: missão em foco, passos, progresso, por quê.
- Concluir passo / avançar cursor.
- Timer na própria home + atalho para página Timer.
- Pausar / retomar sem culpar o usuário.
- Troca de frente via Campanhas (“continuar nesta frente”).
- Tour/guia contextual (onboarding por página).

### 4.2 Timer (`/timer`)

- Pomodoro livre (foco / descanso configuráveis).
- Controles iniciar / pausar / encerrar.
- Flutuar (desktop) quando disponível.
- Integração opcional com missão em foco ao encerrar.

### 4.3 Campanhas (`/campaigns`, `/campaigns/new`, `/campaigns/[id]/edit`)

- Listar, filtrar (todas / hoje / arquivadas).
- Criar e editar: título, why, result, atributo primário, visibilidade.
- Capítulos, missões, passos (superfície + detalhe + minutos).
- Agenda: dias da semana, horário, duração.
- Focar campanha, arquivar / restaurar.
- **Convidar amigo:** código `CP-XXXX-XXXX` (clone privado da árvore).
- **Enviar para Comunidade:** snapshot + revisão do moderador.

### 4.4 Comunidade (`/community`) — pós-MVP explícito na visão original

| Aba / bloco | Função |
|-------------|--------|
| Código CP | Resgatar campanha compartilhada por amigo |
| Campanhas sugeridas | Catálogo **oficial** (Saitama, Baki, Lee…) + **aprovadas** da galera; aceitar = clone + XP/attr |
| Filtros | Todas · Oficiais · Da comunidade |
| Moderação | Só champion moderador (`COMMUNITY_MODERATOR_CHAMPION_ID`, default Isaac = `2`) |
| Desafios | Oficiais semanais (ex. Corda 7 dias); entrar; check-in diário; “X pessoas” + “você N/7” — **sem** ranking de fracasso |
| Praça | 1 post/dia (TZ SP), ~120 chars, campanha opcional; feed curto |
| Clãs | 2–5 pessoas, 7 dias, mesmo protocolo (qualquer oficial ou publicação aprovada); código `CL-…`; check-in em grupo |
| Marcos | Banners coletivos (“N pessoas aceitaram X”) em thresholds 10/50/100 |

### 4.5 Finanças (`/finance`) — satélite opt-in

- Quatro abas: **Início** (totais do mês + formulário), **Lançamentos** (mês a mês), **Gráficos** e **Categorias**.
- Lançamentos com **categoria** (entrada / saída); recorrência opcional (diária / semanal / mensal / anual) com duração (presets, personalizada ou até uma data).
- Aba Lançamentos: navegação ‹ mês › com setas, check de **pago** só em saídas (`paid_at`), filtros por status / tipo / categoria, ordenação, lista ou tabela, paginação.
- Aba Gráficos: períodos (mensal · trimestral · semestral · anual · personalizado) e tipos pizza / barras / comparativo / saldo.
- Categorias padrão na 1ª abertura; criar e arquivar.
- Totais do mês no Início (entradas, saídas, saldo).
- **Não** altera o motor Continuar; coexiste com campanhas de hábitos financeiros.

### 4.6 Sequências (`/streaks`)

- Hábitos **privados** (construir ou evitar).
- Marcar / desmarcar o dia; calendário; melhor sequência.
- Escudos (amortecer um dia perdido, sem virar pressão na home de campanha).
- Vínculo opcional a campanhas (auto-mark).
- Separado do motor de campanha: **não** pune pausa de missão.

### 4.7 Identidade & Mundo

| Rota | Função |
|------|--------|
| `/profile` | Ficha: nível, XP, atributos, bio, pins (≤3) |
| `/analytics` | Minutos por dia a partir de sessões concluídas; filtro por campanha |
| `/champions` | Galeria e visita a perfis públicos — inspiração, **não** ranking |

### 4.8 Conta e onboarding

- Login / registro com convite.
- Sessão NextAuth (credenciais).
- Tours por área (Continuar, editor, Timer, Campanhas, Comunidade, Finanças, Sequências, Perfil, Atividade, Campeões).
- Reinício de tours nas configurações.

### 4.9 PWA / shell

- UI responsiva desktop + mobile.
- Menu lateral / bottom bar.
- Install prompt (botão de instalar onde aplicável).
- Atmosfera dark / copper alinhada à visão visual.

---

## 5. O que ainda está fora (ou parcial)

Alinhado a `VISION.md` / `MVP_SCOPE.md` / `FEATURE_QUARANTINE.md`:

| Item | Status |
|------|--------|
| IA montando campanhas | Fora |
| Ranking global / loja / coins / quests aleatórias | Quarentena |
| Validação externa / anti-fraude | Fora |
| App nativo (Tauri / RN) | Fora — PWA |
| Notificações push completas | Fora |
| Offline total | Fora |
| Chat em tempo real na Comunidade | Fora |
| Daystreak agressivo na home de campanha | Evitado de propósito (Sequências são opt-in e privadas) |

---

## 6. Alinhamento com `VISION.md`

### 6.1 O que está **de acordo**

| Princípio / trecho da visão | Realidade atual |
|-----------------------------|-----------------|
| Próximo passo explícito | Continuar é o centro |
| Tudo mastigado | Passos + detalhe + agenda |
| Progressão, não lista infinita | Hierarquia campanha→passo |
| Uma missão principal | Foco único |
| Pausa sem culpa | Pausar / arquivar / retomada |
| Tempo medido | Sessões + Timer |
| Recompensa é consequência | XP/attr no complete / aceitar |
| Tom adulto / dark / RPG | Shell atual |
| PWA desktop + mobile | Uso responsivo + install |
| Sem loja / quests aleatórias na UI | Quarentena respeitada no menu |

### 6.2 Onde a visão **foi estendida** (consciente)

`VISION.md` e `MVP_SCOPE.md` listavam **Comunidade / ranking** como *fora do MVP*.  
Hoje existe uma **Comunidade sem ranking tóxico**:

- Catálogo + revisão humana  
- Desafios / Praça / Clãs com participação leve  
- Sem leaderboard de quem falhou  
- Sem loja / coins  

Isso **não substitui** o Continuar; vive em rota secundária (`/community`).  
É uma **expansão pós-MVP** alinhada ao espírito (“inspiração, não pressão”), mas **diverge do texto congelado** de “comunidade fora”. Recomendação: atualizar `VISION.md` § “Fora do MVP” e `MVP_SCOPE.md` para distinguir:

- ❌ Comunidade competitiva / feed de hábitos  
- ✅ Hub opcional de protocolos, desafios leves e clãs  

### 6.3 Tensão leve a monitorar

| Risco | Mitigação atual |
|-------|-----------------|
| Comunidade distrair do “o que faço agora?” | Continuar continua sendo home; comunidade no menu |
| Sequências parecerem streak punitivo | Privadas; fora da home; escudos; não ligados a pausa de missão |
| Moderação centralizada (1 champion) | Ok no estágio atual; documentar se escalar |

---

## 7. `PROGRESSION_SPEC.md` — ainda vale? O que melhorou?

### 7.1 Continua sendo a fonte de verdade do **motor**

A hierarquia, estados (campanha/capítulo/missão/passo/sessão), missão única ativa, dependências, agenda, profundidade superfície/detalhe, sessão + XP no `completeStep` e Identity (§12) **permanecem corretos** como contrato do núcleo.

### 7.2 O que o produto **implementou / refinou** em cima da spec

| Área | Spec original | Estado atual / melhoria |
|------|---------------|-------------------------|
| Motor Continuar + estados | Caps 2–8 | Implementado no app |
| XP ao concluir passo | `max(5, planned_minutes\|\|10)` + bônus missão | Em uso; feedback BusyRail |
| Atributos + WIS | §12 | `/profile`; grant via `primary_stat` |
| Visibilidade perfil/campanha | §12 | Perfis públicos; campanhas public/private |
| Analytics de sessões | §12 | `/analytics` |
| Campeões sem ranking | §12 | `/champions` |
| Conquistas + pins | §12 | Marcos do motor + ≤3 pins |
| Streak de campanha | Explicitamente **não** punir pausa | Cumprido; Sequências são outro sistema |
| Comunidade | Spec dizia que motor **não** faz ranking/loja | Comunidade existe **fora** do motor de estados; não altera invariantes de missão ativa |
| Clone / share / submit | Não estava na spec do motor | Camada de **distribuição** de árvores (`campaignFactory`, share codes, submissions) |
| Sequências | Fora do motor | Sistema paralelo (`habit_streaks*`) — coerente com “não misturar daystreak de hábito com pausa de campanha” |
| Desafios / clãs check-in | Fora | Participação leve; não cria segunda missão `active` |

### 7.3 Pontos da spec que podem precisar de **nota de errata** (não necessariamente mudança de código)

1. **Abertura:** “Nada aqui é schema de banco ainda” — desatualizado; schema e services existem.  
2. **§9 “O que o motor NÃO faz”** — “Ranking / loja / quests na UI” continua válido; **Comunidade leve** deveria ser mencionada como *fora do motor, rota secundária*.  
3. **Estados `draft` de campanha** — confirmar se a UI usa `draft` ou só `active`/`paused`/`archived` na prática.  
4. **Sugestão do dia por weekday** — agenda existe; prioridade automática vs. missão focada: validar se bate 100% com §6 em todos os edge cases.  
5. **Sessão `aborted` / `resume_note` ricos** — fluxo existe; profundidade da UX de nota pode ser menor que o exemplo da spec.

### 7.4 Veredito curto

| Documento | Veredito |
|-----------|----------|
| `PROGRESSION_SPEC.md` | **Ainda funciona** como contrato do motor de progressão. Foi **cumprido e estendido** com Identity, clones e sistemas satélite (Comunidade, Sequências) que **não quebram** a invariante de uma missão ativa. |
| Onde “melhorou” | Identity completa; factory de campanhas; catálogo oficial; share/submit; sequências privadas; comunidade sem ranking tóxico. |
| Onde “divergiu do papel” | Visão/MVP diziam “sem comunidade”; produto ganhou comunidade **opt-in e leve**. Spec do motor não foi contradita — o mapa de produto sim. |

---

## 8. Fluxos que definem o produto hoje

```text
Abrir app → Continuar → executar passo (+ timer) → XP/attr
                ↓
         Campanhas (criar / focar / editar)
                ↓
    Compartilhar CP  |  Publicar (moderação)  |  Aceitar catálogo
                ↓
    Desafios / Praça / Clãs (participação leve)
                ↓
    Sequências (hábito privado paralelo)
                ↓
    Perfil · Atividade · Campeões (identidade / espelho)
```

---

## 9. Recomendações de documentação (próximos passos)

1. Atualizar `VISION.md` § “Fora do MVP” e `MVP_SCOPE.md` com a Comunidade **permitida** (leve) vs **proibida** (ranking/loja).  
2. Acrescentar em `PROGRESSION_SPEC.md` um §13 “Sistemas satélite” (Comunidade, Sequências, Share) deixando claro que **não** alteram estados do motor.  
3. Atualizar `README.md` (PWA “ainda não” está defasado se install já existe).  
4. Manter este arquivo (`PRODUCT_STATUS.md`) como inventário vivo após cada sprint grande.

---

## 10. Referências

| Doc | Papel |
|-----|--------|
| `VISION.md` | Propósito e princípios |
| `MVP_SCOPE.md` | Escopo congelado do MVP (parcialmente ultrapassado pela Comunidade) |
| `PROGRESSION_SPEC.md` | Regras do motor |
| `FEATURE_QUARANTINE.md` | Legado fora da UI |
| `IMPLEMENTATION_PLAN.md` | Ordem histórica de caps |
| `campaigns/SPRINTS-CAP9-13.md` | Identity & Mundo |
| Onboarding | `src/lib/onboarding/tours.js` |

---

*Gerado para refletir o código e a documentação do repo em julho/2026. Se a visão formal mudar, atualizar este arquivo na mesma PR.*
