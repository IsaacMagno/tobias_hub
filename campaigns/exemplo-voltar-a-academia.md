# Exemplo — Voltar à academia

> Formato de validação do modelo (Missão 1.3). Não é rotina obrigatória ainda — prova que “mastigado” cabe na spec.

**status:** `draft` (vira `active` no app no Cap. 4)  
**result:** Ir à academia 2× por semana com treino já definido, sem improvisar na porta.  
**why:** Saúde e energia; eliminar a decisão “o que faço hoje na academia?”.

---

## CURSOR

```text
Missão ativa: 1.1 — Primeira semana (2×)
Passo atual:  1 — Sair de casa com a sacola pronta
Estado:       available (exemplo)
Agenda hoje:  Seg 18:00 · 60 min
Nota de retomada: (vazia)
Próxima ação: executar só a superfície do passo 1
```

---

## Capítulo 1 — Retomar o hábito (2×/semana)

**status:** `active`  
**objetivo:** Completar 4 idas à academia (2 semanas) sem mudar a ficha ainda.  
**deps:** —

### Missão 1.1 — Primeira semana (2×)

- **status:** `available`
- **agenda:** `weekdays: seg, qui` · `time: 18:00` · `planned_minutes: 60`
- **por quê:** Frequência antes de otimizar carga.

| # | Superfície | Detalhe (abrir só se quiser) | min | status |
|---|------------|------------------------------|-----|--------|
| 1 | Sair de casa com a sacola pronta (roupa + garrafa) | Checklist: tênis, camisa, shorts, toalha, garrafa | 10 | current |
| 2 | Chegar na academia e aquecer | Esteira ou bike 5 min · mobilidade de ombro/quadril 2–3 min | 10 | pending |
| 3 | Bloco A — superiores | Supino máquina 3×10 · Remada 3×10 · Desenvolvimento 3×10 · Tríceps 2×12 · Bíceps 2×12 · Descanso ~60–90s | 25 | pending |
| 4 | Alongar e ir embora | Peito, costas, ombros 3–4 min · registrar no Tobias ao sair | 10 | pending |

**Pomodoro/sessão sugerida:** um timer de **60 min** cobrindo os passos 2–4 no dia de treino; ou timers por passo se preferir.

### Missão 1.2 — Segunda semana (2×)

- **status:** `locked` (deps: 1.1 — 2 treinos feitos)
- **agenda:** igual à 1.1
- **passos:** mesma superfície da 1.1 (repetir ficha); detalhe idêntico

| # | Superfície | Detalhe | min | status |
|---|------------|---------|-----|--------|
| 1 | Sacola pronta e sair | (igual 1.1) | 10 | pending |
| 2 | Aquecer | (igual 1.1) | 10 | pending |
| 3 | Bloco A — superiores | (igual 1.1) | 25 | pending |
| 4 | Alongar + registrar | (igual 1.1) | 10 | pending |

---

## Capítulo 2 — Incluir pernas (ainda 2×)

**status:** `locked` (deps: Cap. 1 completo)  
**objetivo:** Alternar superior / inferior sem aumentar dias ainda.

### Missão 2.1 — Semana com dia de pernas

- **agenda:** `seg, qui` · `18:00` · `60`
- **passos (dia de pernas — Qui):**

| # | Superfície | Detalhe | min | status |
|---|------------|---------|-----|--------|
| 1 | Sacola + sair | | 10 | pending |
| 2 | Aquecer | Bike 5 min · agachamento peso corporal 2×10 | 10 | pending |
| 3 | Bloco B — inferiores | Leg press 3×10 · Cadeira extensora 3×12 · Mesa flexora 3×12 · Panturrilha 3×15 | 30 | pending |
| 4 | Alongar + registrar | | 10 | pending |

*(Seg continua Bloco A da missão 1.1.)*

---

## Capítulo 3 — Subir para 3×/semana

**status:** `locked`  
**objetivo:** Terça ou sábado como terceiro dia (ficha leve ou repetir A/B).  
*Detalhar só depois de Cap. 2 vivo no app.*

---

## Checagem do modelo

| Pergunta | Ok? |
|----------|-----|
| Na hora H, dá para ler só CURSOR + superfície? | sim |
| Dias e duração estão explícitos? | sim |
| Detalhe de exercício é opcional? | sim |
| Dá para pausar no passo 3 com nota? | sim (“parei na remada 2/3”) |
| Capítulos futuros ficam locked sem ansiedade? | sim |
