# Sprints Cap. 9 → 13 — Identidade & Mundo

Workspace: `Desktop/Tobias`  
Status: **concluído**

## Caps

| Cap | Entrega | Status |
|-----|---------|--------|
| 9 | Attrs + grant + WIS + título + `/profile` | done |
| 10 | Visibility + ficha pública | done |
| 11 | `/analytics` | done |
| 12 | `/champions` + visita | done |
| 13 | Conquistas + pins | done |

## Checklist

### Sprint 0 — Playbook
- [x] 0.1 Este playbook
- [x] 0.2 `IMPLEMENTATION_PLAN.md`
- [x] 0.3 `FEATURE_QUARANTINE.md`
- [x] 0.4 `PROGRESSION_SPEC.md` Identity

### Sprint 1 — Cap. 9 schema/grant
- [x] 1.1 Migration `statistics`
- [x] 1.2 Migration `campaigns.primary_stat`
- [x] 1.3 Helper `attributes.js`
- [x] 1.4 Serviço grant + title
- [x] 1.5 `completeStep` grant
- [x] 1.6 Aceite Cap. 9 backend

### Sprint 2 — Cap. 9 UI
- [x] 2.1 `getMyProfile`
- [x] 2.2 Rota `/profile`
- [x] 2.3 Editar bio
- [x] 2.4 Editor `primary_stat`
- [x] 2.5 BusyRail attr
- [x] 2.6 Nav Perfil
- [x] 2.7 Docs Cap. 9

### Sprint 3 — Cap. 10 visibility
- [x] 3.1 Migration visibility
- [x] 3.2 Toggle campanha
- [x] 3.3 Toggle perfil
- [x] 3.4 `getPublicProfileCard`
- [x] 3.5 Checks server-side
- [x] 3.6 Docs Cap. 10

### Sprint 4 — Cap. 11 analytics
- [x] 4.1 `getSessionAnalytics`
- [x] 4.2 Rota `/analytics`
- [x] 4.3 Filtro por campanha
- [x] 4.4 Nav Analytics
- [x] 4.5 Docs Cap. 11

### Sprint 5 — Cap. 12 Campeões
- [x] 5.1 `listPublicChampions`
- [x] 5.2 `/champions`
- [x] 5.3 `/champions/[id]`
- [x] 5.4 Preview “como te veem”
- [x] 5.5 Nav Campeões
- [x] 5.6 Docs Cap. 12

### Sprint 6 — Cap. 13 conquistas
- [x] 6.1 Migration achievements/pins
- [x] 6.2 Seed ~10
- [x] 6.3 `evaluateAchievements`
- [x] 6.4 UI perfil pins
- [x] 6.5 Pins na ficha pública
- [x] 6.6 BusyRail marco
- [x] 6.7 Docs Cap. 13 + fechar fila

## Arquivos-chave

- Migration: `supabase/migrations/20260723120000_identity_world.sql`
- Helpers: `src/lib/helpers/attributes.js`
- Serviços: `champions.js`, `analytics.js`, `campaigns.js` (`completeStep`)
- UI: `/profile`, `/analytics`, `/champions`, `/champions/[id]`
- Editor: `primary_stat` + `visibility`
