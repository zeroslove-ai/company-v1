# Guarded state merge contract

## Delta-only merge

Extract returns a delta, never a full save replacement. The merge accepts only allowlisted paths. Unknown paths are ignored with warnings; noncritical missing paths preserve prior state. A patch with stale `updated_turn` is ignored.

Explicit `null` clears only fields declared nullable. Reference arrays and snapshot arrays are replaced only when their path is allowlisted. Map-like state merges by key. The event ledger appends by `event_id` and deduplicates existing IDs.

## Guardrails

- Extract cannot mark an action complete without Story evidence.
- A completed sexual state without permitted evidence is a hard rejection.
- A patch cannot update an NPC who is absent from the scene.
- Relationship axes, common-sense baseline, CSA attitudes, consent, attraction, and emotion do not auto-link or auto-promote.
- A mandatory CSA cannot auto-grant behavior outside its exact `required_action`.
- Player agency is preserved: the state patch cannot invent an unchosen player action.
- Location movement alone cannot reset all clothing or pose state; temporary state has explicit expiry.

## Graded outcome

`success`, `partial`, `refused`, `interrupted`, and `blocked` are distinct outcome values. A non-success outcome is still a valid turn result and must not become a generic whole-turn failure.
