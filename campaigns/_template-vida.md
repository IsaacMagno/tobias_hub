# Template — Campanha de vida

Copie este arquivo para `campaigns/0X-nome.md` e preencha.  
Usado no papel/markdown até o app existir; os mesmos campos viram schema depois.

---

## Metadados

| Campo | Valor |
|-------|--------|
| `id` / slug | |
| `title` | |
| `status` | `draft` \| `active` \| `paused` \| `completed` \| `archived` |
| `result` | Uma frase: o “nível 200” desta frente |
| `why` | Por que isso importa (1–2 frases) |

---

## CURSOR (sempre no topo ao usar)

```text
Missão ativa:
Passo atual:
Estado:
Agenda hoje:     (ex.: Seg 18:00 · 60 min · ou “sem agenda hoje”)
Nota de retomada:
Próxima ação:
```

---

## Capítulos

Para cada capítulo:

### Capítulo N — Título

- **status:** `locked` \| `available` \| `active` \| `completed`
- **objetivo do capítulo:** resultado reconhecível
- **deps:** (capítulo anterior, se houver)

#### Missão N.M — Título

- **status:** …
- **deps:** …
- **por quê:** …
- **agenda (opcional):**
  - `weekdays:` (ex.: seg, qui)
  - `time:` (ex.: 18:00)
  - `planned_minutes:` (ex.: 60)
- **passos:**

| # | Superfície (o que fazer) | Detalhe (opcional, colapsável) | min | status |
|---|--------------------------|--------------------------------|-----|--------|
| 1 | | | | pending / current / done |

---

## Regras rápidas ao preencher

1. Só **uma** missão `active` no CURSOR global da pessoa (mesmo com várias campanhas).
2. Passos de superfície ≤ ~45–60 min quando possível; senão quebrar.
3. Detalhe nunca substitui a superfície — é aprofundamento.
4. Fora do dia de agenda: não cobrar; só não sugerir como “hoje”.
5. Pausar = escrever `Nota de retomada`; não apagar o passo.
