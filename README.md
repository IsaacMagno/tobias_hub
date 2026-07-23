# Tobias (nova versão)

Workspace da evolução do Tobias: **motor de progressão pessoal** (campanhas, Continuar, pomodoro, PWA).

O projeto original permanece em:

`OneDrive/Desktop/programas/programasPC/tobias`

Aqui só entrou o que a nova visão precisa **agora**, mais uma pasta `refatoracao/` com cópias descritivas do legado a avaliar.

## Documentos

- `VISION.md` — produto e MVP
- `MVP_SCOPE.md` — escopo congelado
- `IMPLEMENTATION_PLAN.md` — fila Cap. 2 → 4
- `PROGRESSION_SPEC.md` — estados e regras
- `FEATURE_QUARANTINE.md` — o que ficou de fora da UI
- `campaigns/01-motor-de-campanha.md` — campanha meta (CURSOR)
- `campaigns/_template-vida.md` / `exemplo-voltar-a-academia.md`
- `refatoracao/README.md` — índice do código em quarentena

## Stack ativa

- Next.js 14 (App Router)
- Supabase + NextAuth
- Server Actions enxutas (`src/app/actions/tobias.js`)

## Como rodar

```bash
cd ~/OneDrive/Desktop/Tobias   # ou o caminho da Área de Trabalho
cp .env.example .env           # preencher Supabase + NextAuth (pode reutilizar do hub)
npm install
npm run dev
```

## PWA

Alvo: **desktop e celular** (instalável). Manifest + service worker ainda não foram adicionados — próximo passo de implementação.

## Estrutura

```text
Tobias/
├── src/                 # app ativo (shell Continuar)
├── public/
├── campaigns/
├── refatoracao/         # legado para avaliar (nomes descritivos)
├── VISION.md
├── PROGRESSION_SPEC.md
└── FEATURE_QUARANTINE.md
```
