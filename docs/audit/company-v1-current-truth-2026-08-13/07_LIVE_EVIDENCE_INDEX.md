# Live Evidence Index

Evidence is indexed by provenance and validity scope. Existing artifact files
were not modified, deleted, staged, or committed.

## Preserved evidence

| Artifact(s) | Phase / capture | Known turn state | What it can prove | What it cannot prove |
|---|---|---:|---|---|
| `phase12n-b-live.json`, `phase12n-b-live-report.json` | 12K live report; file timestamp 2026-08-12 | report contains turn/run metadata; exact current SHA not embedded as authoritative | Prior live canary outcome and stop/report behavior | Current runtime truth, current DB definitions, or later Q-series protocol |
| `phase12p-b-pre-fix-15turn-history.json`, `phase12p-b-pre-fix-current-context.json` | 12P-B pre-fix; 2026-08-13 file timestamp | 15-turn history/context | Relation target contamination, choice/mind/story observations recorded then | Post-B/B.1/B.2/B.3 behavior or current deployed source |
| `phase12p-pre-fix-21turn-history.json`, `phase12p-pre-fix-current-context.json` | earlier 12P pre-fix; 2026-08-12 file timestamp | 21-turn history/context | Earlier presentation/monitor/physical continuity observations | Any later prompt/parser/Engine contract |
| `phase12q1-pre-deploy-39turn-action-history.json` | Q.1 pre-deploy action history; captured 2026-08-13 around 11:55Z | 39 turns | Action provenance and accumulated live state before Q.1 reset | Q.1/Q.2 opening protocol, because it predates that runtime deployment |
| `phase12q1-pre-deploy-39turn-history.json` | Q.1 pre-deploy history; captured around 11:55Z | 39 turns | Full turn-level narrative/history evidence | Current truth after reset or newer runtime behavior |
| `phase12q1-pre-deploy-39turn-current-context.json` | Q.1 pre-deploy context; captured around 11:55Z | committed turn 39 | Full hydrated context at 39 turns | Live DB schema/migration truth; later runtime behavior |
| `phase12q1-pre-deploy-39turn-current-save.json` | Q.1 pre-deploy save; captured around 11:55Z | committed turn 39, save revision 808 | Canonical save snapshot at capture | Current save; it is an historical snapshot |
| `phase12q1-opening-failure-current-context.json` | Q.1 first Opening failure; captured around 12:14Z | committed turn 0, setup reserved, opening planned | Concrete recovery blocker and setup/opening state | Whether later Q.2 code is correct in a fresh live run |
| `phase12q1-opening-failure-current-save.json` | Q.1 first Opening failure save; captured around 12:14Z | committed turn 0, save revision 810 | Reserved setup/opening failure state | Any turn or DB mutation after capture |

## Deployment provenance

The preceding deployment report recorded API and frontend deployment from
reviewed SHA `4447b176fb7e4eeaa53ad6cdbad92e2e845569c2` before the Q.2 work. The
recorded Worker version IDs were:

- API `game-proxy-company-v1`: `009d2165-777a-47f6-8403-adfe68af096c`
- Frontend `gamebuilder-company-v1`: `091ce7b0-4b1b-4a0e-b468-82df0ce57e25`

This is session/deployment-report provenance, not an independent Cloudflare
control-plane query performed during this audit. The audit baseline source is
`5ba68bb`, so the old 39-turn evidence must not be used to judge Q.2 or future
runtime behavior without source/deployment matching.

## Validity rules

1. Artifact capture SHA/version outranks its filename; when absent, validity is
   limited to the recorded state, not a specific code claim.
2. A live run can demonstrate an observed transition, not the absence of other
   writers or correctness of an unobserved DB function.
3. A pre-reset snapshot remains valuable historical evidence and must not be
   reused as current state.
4. Q.1 39-turn evidence is valid for accumulated pre-reset state analysis, not
   for opening protocol claims introduced or corrected afterward.
5. Production evidence is intentionally absent; Production was not accessed.
