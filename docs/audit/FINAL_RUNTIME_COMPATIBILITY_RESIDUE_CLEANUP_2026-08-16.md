# Final Runtime Compatibility Residue Cleanup

Status: source/test cleanup complete; waiting for operator review.

## Identity

- Task: `final-runtime-compatibility-residue-cleanup-v1`
- Branch: `company/scene-location-presence-v1`
- Accepted gameplay executable: `0fc509911e5bdf5aabb92fe5241a845f686bdb17`
- Live TEST/Production/DB operations during this cut: zero

## Caller and persisted-data inventory

| Boundary | Current callers/data proof | Decision |
| --- | --- | --- |
| `fresh-narrative-parser.js` | Fresh Story path in `src/api/turn-routes.js`; fresh parser contract tests | Keep as the only fresh-generation parser |
| `narrative-parser.js` | Historical syntax reader called only by `parsePersistedNarrative()`; legacy section/choice/dialogue rows and existing replay fixtures | Keep as a private historical reader |
| `legacy-narrative-parser.js` | No independent caller; it only re-exported `narrative-parser.js` | Delete alias; persisted reader imports the historical reader directly |
| `persisted-narrative-parser.js` | Opening/history/recovery/replay paths in `src/api/turn-routes.js`; historical rows require it | Keep as the single persisted Story compatibility boundary |
| `legacy-extract-adapter.js` | Called by `normalizePersistedExtractObservation()` for stored V1 `state_delta` rows; replay/commit routes consume that boundary | Keep as inert historical read adapter |
| `persisted-extract-observation.js` | Current V2 persisted rows and V1 replay normalization in `src/api/turn-routes.js` | Keep |
| `hydrateLegacySceneV1()` | Old saves in gameplay hydration, API display, and frontend view-model recovery | Keep as the one old-save scene bootstrap |
| `readCanonicalSceneV1()` | Current scene reads in gameplay/display paths | Keep as strict authority |
| `projectCanonicalSceneToLegacy()` | Current commit reducer and gameplay hydration write legacy mirrors for proven old readers | Keep; mirror deletion is not proven safe |
| legacy Story/Extract/CSA RPC names | Historical migration/catalog evidence only; no current source caller; Stage B gate forbids them | Do not add wrappers; preserve historical migrations and gate evidence |
| `action-status` API | Frontend pending-action recovery calls it directly | Keep |
| frontend pending/context state | Pending storage is reconnect UI state; committed server context remains authority | Keep; no duplicate gameplay writer found |

## Source/test cleanup performed

- Removed the zero-consumer `legacy-narrative-parser.js` re-export alias.
- Routed historical-parser tests through `parsePersistedNarrative()` so tests
  exercise the same persisted-read boundary as replay/recovery.
- Removed an orphaned compatibility-projection comment with no implementation
  or caller behind it.
- Did not modify the fresh parser, persisted adapters, scene mirrors, DB
  migrations, provider/model behavior, or frontend product behavior.

Source/test commit: `1025f4da096389838328afc1982ba9a47d421421`.

Validation: `npm.cmd test` passed 417/417; targeted persisted-parser,
replay, Extract, scene, display, and frontend recovery tests passed 92/92;
changed JS/MJS syntax checks passed; `git diff --check` passed.

## Intentionally retained compatibility

Historical Story/Extract readers and old-save scene hydration remain because
their concrete current callers read persisted rows or old saves. Canonical
scene, fresh Story generation, current Extract V2, committed parsed blocks,
physical/clothing state, choices/free text, CSA state, sexual ledger, and media
selection remain outside this deletion.
