# Especificação do Motor de Progressão

Documento de regras. Fonte da verdade junto com `VISION.md`.  
Nada aqui é schema de banco ainda — são regras de comportamento que o código deverá obedecer.

---

## 1. Hierarquia

```text
Campanha
└── Capítulo
    └── Missão
        └── Passo
            └── Sessão de execução
```

| Nível | Pergunta que responde |
|-------|------------------------|
| Campanha | Em qual frente da vida estou avançando? |
| Capítulo | Qual fase dessa frente estou vivendo? |
| Missão | Qual resultado intermediário estou buscando agora? |
| Passo | Qual é a menor ação concreta agora? |
| Sessão | Estou executando neste momento? Onde parei? |

**Objetivo** (do `VISION.md`) pode existir como rótulo de capítulo ou de missão no MVP. Não precisa ser entidade separada na primeira versão.

---

## 2. Estados

### 2.1 Campanha

| Estado | Significado |
|--------|-------------|
| `draft` | Em montagem; não aparece como “continuar”. |
| `active` | Em andamento; pode ter missão principal. |
| `paused` | Congelada de propósito; não compete por foco. |
| `completed` | Resultado da campanha atingido. |
| `archived` | Fora de vista; histórico. |

Regras:

- Pode haver várias campanhas `active`.
- Só **uma** missão principal por usuário em todo o sistema (não uma por campanha).
- Pausar campanha remove automaticamente o status de “missão principal” das missões dela.

### 2.2 Capítulo

| Estado | Significado |
|--------|-------------|
| `locked` | Pré-requisitos não cumpridos. |
| `available` | Desbloqueado; ainda sem missão em curso nele. |
| `active` | Contém a missão principal ou missões em progresso. |
| `completed` | Todas as missões obrigatórias concluídas. |

Regras:

- Capítulos têm ordem (`order_index`) e, opcionalmente, dependência de outro capítulo.
- Só o capítulo `active` (ou o primeiro `available`) deve receber atenção na UI principal.
- Capítulos futuros `locked` podem ser listados como “bloqueado”, sem detalhe de passos.

### 2.3 Missão

| Estado | Significado |
|--------|-------------|
| `locked` | Dependências não cumpridas. |
| `available` | Pode ser escolhida / promovida a principal. |
| `active` | É a **missão principal** do usuário. |
| `in_progress` | Já houve sessão; não é a principal agora (ex.: campanha paralela ou troca de foco). |
| `paused` | Usuário pausou de propósito; guarda `resume_note`. |
| `completed` | Todos os passos obrigatórios feitos (ou missão marcada concluída). |
| `skipped` | Descartada com motivo; não bloqueia o que não dependia dela (regra explícita por dependência). |

**Invariante crítico:** no máximo **uma** missão em estado `active` por usuário.

Transições permitidas:

```text
locked → available          (deps satisfeitas)
available → active          (promovida a principal)
active → paused             (pausar)
active → completed          (passos ok ou conclusão manual)
active → in_progress        (outra missão virou principal)
paused → active             (retomar como principal)
paused → in_progress        (retomar sem ser principal — raro no MVP)
in_progress → active        (voltar ao foco)
available|in_progress|paused → skipped
* → locked                  (somente se deps forem reabertas — fora do MVP)
```

### 2.4 Passo

| Estado | Significado |
|--------|-------------|
| `pending` | Ainda não iniciado. |
| `current` | É o próximo passo da missão ativa (ou da missão em foco). |
| `done` | Concluído. |
| `skipped` | Pulado (se permitido). |

Regras:

- Em uma missão, no máximo **um** passo `current`.
- Ao concluir o passo `current`, o próximo `pending` vira `current`.
- Se não houver próximo, a missão pode ser marcada `completed`.

### 2.5 Sessão

| Estado | Significado |
|--------|-------------|
| `running` | Em execução agora. |
| `completed` | Encerrada com sucesso parcial/total. |
| `aborted` | Cancelada sem progresso útil. |

Regras:

- No máximo **uma** sessão `running` por usuário.
- Sessão pertence a um passo (e, por consequência, a uma missão).
- Ao pausar ou sair, a sessão deixa de ser `running` e grava `resume_note` (texto curto: “parei no componente X”).

---

## 3. Dependências e desbloqueio

Tipos de dependência (MVP):

1. **Missão → Missão:** B só fica `available` quando A está `completed` (ou `skipped` se a aresta permitir skip).
2. **Capítulo → Capítulo:** capítulo N+1 libera quando N está `completed`.

Avaliação:

- Sempre que uma missão muda para `completed` ou `skipped`, o motor recalcula missões `locked` da mesma campanha.
- UI nunca oferece iniciar missão `locked`.
- Bloqueio é feature, não bug: reduz opções.

---

## 4. Missão principal e “Continuar”

### O que a home deve mostrar

```text
Campanha: …
Capítulo: …
Missão ativa: …
Por quê isso importa: … (1 frase)
Próximo passo: …
Tempo estimado: …
[ Continuar ]  [ Pausar ]  [ Outras frentes ]
```

### Como se escolhe a missão principal

Ordem de prioridade automática (quando não houver `active`):

1. Missão `paused` mais recentemente pausada (retomada natural).
2. Missão `in_progress` mais recente.
3. Primeira missão `available` do capítulo ativo (por `order_index`).
4. Nenhuma → mostrar “definir próxima missão” / “ativar campanha”.

O usuário pode trocar a principal apenas entre missões `available`, `paused` ou `in_progress` (nunca `locked`).

### Pausar vs trocar de frente

| Ação | Efeito |
|------|--------|
| **Pausar** | Missão `active` → `paused`; grava nota; home pode sugerir outra frente. |
| **Trocar de frente** | Missão atual `active` → `in_progress` (ou `paused` se preferir); outra vira `active`. |
| **Parar de usar o app** | Sessão `running` → encerra; missão permanece `active` ou `paused` conforme última ação. |

Pausar **não** é fracasso. Streak do RPG legado não deve punir pausa de missão de campanha (regra de produto: separar daystreak de hábitos de “pausa de campanha”).

---

## 5. Sessão de execução + Pomodoro

Fluxo:

1. Usuário toca **Continuar** no passo `current`.
2. Cria sessão `running` com `started_at`.
3. Timer / pomodoro inicia com duração sugerida do passo ou da missão (editável na hora).
4. Ao terminar:
   - **Concluir passo** → passo `done`, próxima vira `current`, sessão `completed`, `duration_seconds` gravado.
   - **Pausar timer** ≠ pausar missão: só congela o relógio.
   - **Pausar missão** → ação explícita; grava `resume_note`.
5. Recompensa RPG: XP ao concluir passo = `max(5, planned_minutes || 10)`; ao concluir a missão no mesmo fluxo, bônus `+25`. Feedback na UI via BusyRail (`+N XP`); nível no chip do Continuar. Sem hub de atributos na home.
6. Atributos (Cap. 9): ver §12 Identity — grant no `primary_stat` da campanha; WIS derivada; BusyRail pode mostrar `+N FOR` etc.

### Pomodoro (MVP)

| Campo | Uso |
|-------|-----|
| `planned_minutes` | Duração sugerida (ex.: 25, 45, 60) |
| `elapsed_seconds` | Tempo efetivo da sessão |
| Ciclos | Opcional: N focos + pausa curta; default simples = **um timer por sessão** |

Objetivo: organizar a execução e **medir tempo investido** por passo/missão/campanha — não gamificar o timer.

### Retomada

Campo `resume_note`:

> “Parei no terceiro exercício do bloco A.”

A home mostra essa nota abaixo do próximo passo.

---

## 6. Agenda (dias + horário + duração)

Para missões recorrentes (ex.: academia):

| Campo | Exemplo |
|-------|---------|
| `weekdays` | `seg`, `qui` |
| `time` | `18:00` (opcional) |
| `planned_minutes` | `60` |

Regras:

- No dia correspondente, essa missão/passo pode aparecer como **sugestão do dia** se não houver outra `active` mais prioritária.
- Fora do dia, permanece na campanha sem cobrar atraso (sem forçar).
- O horário aponta para ação **já definida** — nunca para “decidir o que fazer”.
- Notificações push completas: pós-MVP. PWA instalada + abertura manual basta no início.

---

## 7. Profundidade opcional (detalhe mastigado)

Passos têm duas camadas:

1. **Superfície** — o que fazer (obrigatório na UI).
2. **Detalhe** — colapsável (ex.: lista de exercícios, séries, link, checklist longo).

Quem quer só ir e fazer vê a superfície. Quem quer ir a fundo abre o detalhe. O detalhe **não** compete com o próximo passo na hierarquia visual.

---

## 8. PWA (desktop e celular)

- Manifest + service worker (Next.js) para instalar no Windows (Chrome/Edge) **e** no Android/iOS (Safari/Chrome) como app.
- UI responsiva: a superfície **Continuar + pomodoro** deve funcionar bem no telefone e no monitor.
- Offline completo: pós-MVP; cache mínimo da shell ok.
- Referência de *sentimento* desktop: Ganymede (na prática é **Tauri**). Tobias no MVP = **PWA multiplataforma**; Tauri só se PWA for insuficiente no PC.

---

## 9. O que o motor NÃO faz no MVP

- Sortear missões diárias aleatórias como caminho principal.
- Ranking / loja / quests na UI (ver `FEATURE_QUARANTINE.md`).
- Exigir validação externa.
- Várias missões `active` ao mesmo tempo.
- IA gerando a árvore sozinha.
- Punir pausa com quebra de streak de campanha.
- Hub de atributos ou conquistas na home (Identidade = rotas secundárias).

---

## 10. Critérios para validar esta spec

A campanha `campaigns/01-motor-de-campanha.md` deve funcionar em markdown até o app existir:

1. Abrir só o CURSOR.
2. Executar o passo (com timer de verdade no celular/relógio se quiser).
3. Marcar done e avançar o cursor.
4. Pausar com nota e retomar no dia seguinte.

Quando o app existir, o mesmo fluxo com PWA + pomodoro.

---

## 11. Pacote de planejamento (status)

| Documento | Função |
|-----------|--------|
| `VISION.md` | Propósito e princípios |
| `MVP_SCOPE.md` | O que entra / não entra (congelado) |
| `PROGRESSION_SPEC.md` | Estados e regras |
| `FEATURE_QUARANTINE.md` | Legado fora da UI |
| `IMPLEMENTATION_PLAN.md` | Ordem de build |
| `campaigns/_template-vida.md` | Forma de uma campanha de vida |
| `campaigns/exemplo-voltar-a-academia.md` | Prova de formato |
| `campaigns/01-motor-de-campanha.md` | CURSOR da campanha meta |

**Capítulo 1 (planejamento) = concluído.** Caps 2–8 em código. Caps 9–13: Identidade & Mundo (`campaigns/SPRINTS-CAP9-13.md`).

---

## 12. Identity & Mundo (Caps 9–13)

Andar secundário: Perfil / Analytics / Campeões. Não desloca Continuar.

### Atributos

| Campo | Papel |
|-------|--------|
| `campaigns.primary_stat` | `strength` \| `agility` \| `inteligence` \| `vitality` (default `inteligence`) |
| `statistics.*` | Totais do campeão |
| Grant no `completeStep` | `+max(1, floor(planned_minutes/10))` no primary; se missão completa, `+2` extra |
| `wisdom` | `floor((STR+AGI+INT+VIT)/15)` — nunca concedida direto |
| Título | Faixas legado (Lêmure→Humano + subtítulo do attr dominante); sem `xpBoost` |

### Visibilidade

| Campo | Valores | Default |
|-------|---------|---------|
| `champions.profile_visibility` | `private` \| `public` | `private` |
| `campaigns.visibility` | `private` \| `public` | `private` |

Ficha pública: nome, title, level, xp, 5 attrs, ≤3 pins, campanhas `public` (título, status, % progresso). Sem passos, `why` íntimo ou sessões.

### Analytics

Agregar `work_sessions` (`completed`) por dia via `elapsed_seconds`.

### Conquistas

Marcos do motor (passo, capítulo, campanha, sessões, attrs, nível, primeira campanha pública). Pins: até 3 no perfil.
