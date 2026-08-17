# Protocol Matrix

The table follows the actual Company path from request to next render. “Wire”
means provider-facing or persisted serialized data; “projection” means a view
that must not become a durable authority.

| Producer | Protocol / boundary | Consumer | Same contract? | Authority status / conflict |
|---|---|---|---|---|
| Player setup frontend | JSON `/api/player-setup` payload | `turn-routes.js` + reserve setup RPC | Mostly | Setup validation is server-side; frontend has recovery/session state. |
| Opening prompt | fresh opening marker protocol from `opening-prompt.js` | Story provider | Historically no; Q.2 baseline aligns ACTING grammar | Special opening contract remains separate from ordinary Story. |
| Opening provider wire | `[DIALOGUE]`, `[ACTING]`, `[THOUGHT]`, choices | fresh parser / opening splitter | Partial | Parser fail-open and opening-specific handling coexist. |
| Player action | reserved `game_actions` row / structured action | Story route | Yes at lifecycle level | Stored action should outrank client resend; direct status helpers remain. |
| CSA app | planner/validator payload + signed resolution | Story route / CSA projection | Partial | App transaction and Story enactment are distinct phases. |
| Story prompt | projected context, active rules, obligations, action, durable rules | Story provider | Partial | Prompt, content catalog, and stored state duplicate wording/metadata. |
| Provider streaming | SSE wire events / raw Story chunks | stream decoder + frontend | Partial | Frontend sees temporary projection before durable commit. |
| Stream decoder | Story wire markers | `fresh-narrative-parser.js` | Partial | Malformed presentation and mandatory world binding have different failure policies. |
| Fresh parser | parsed blocks, warnings, structural protocol result | Story route, Extract prompt, frontend | Partial | Persisted parser and legacy parser remain as compatibility surfaces. |
| Engine enactments | `enactment_id`, canonical segment/obligation metadata | provider ACTING binding validator | Intentional split | Engine is world authority; provider must visibly render required result. |
| Story raw text | exact provider output after canonical composition | Extract prompt | Yes as evidence input | Raw Story is canonical narrative evidence; Extract cannot invent absent facts. |
| Story + parsed blocks | Extract context contract | Extract provider | Partial | Extract receives structured targets and exact evidence requirements. |
| Extract provider output | JSON observation envelope | normalizer + observation reducers | Partial | Legacy adapter still accepts older shape; deletion candidate. |
| Normalized Extract | domain observations with quotes/evidence | deterministic reducers | Intended yes | Evidence gates are deterministic; some fail-open paths remain. |
| Reducers | next save patch / canonical domain updates | commit route | Intended yes | Reducers can update multiple domain mirrors in one turn. |
| Commit payload | `next_save`, turn summary, monitor, choices, Story | `commit_company_turn` | Intended yes | DB RPC is final durable boundary; actual deployed signature unverified. |
| Supabase save | save/context RPC result | `get_company_context` / routes | Partial | Hydration compatibility can reconstruct older fields. |
| Context | server context envelope | frontend state/view model | Partial | Session history and pending action are client-side projections. |
| Frontend state | view model + session/pending/recovery state | renderer | No single durable authority | UI must not write canonical gameplay state. |
| Reset RPC | reset save/actions/turns | API response + frontend cache | Partial | Reset server boundary exists; cached session state is separate cleanup. |

## Current protocol rules

- A provider phrase is not a durable state update without an Extract
  observation that passes evidence checks, except for deterministic Engine
  enactment state explicitly written by the Engine commit path.
- A parsed block is not a substitute for raw Story text.
- A frontend stream event is not a committed turn.
- A DB function found in migrations is not evidence that the current JS invokes
  it; caller evidence must come from `src/**`.
- A legacy parser/adapter is compatibility, not a second semantic authority.

## Known protocol collision patterns

1. Opening and ordinary Story have related but historically different marker
   grammar.
2. Story provider output, stream decoding, fresh parsing, and persisted parsing
   all contain protocol decisions.
3. Engine canonical enactment and provider prose are two halves of one action,
   but only the Engine side should decide the world fact.
4. Extract’s legacy adapter can accept shapes that the fresh producer no longer
   emits.
5. Supabase RPC names and direct REST table mutations form overlapping action
   lifecycle surfaces.
