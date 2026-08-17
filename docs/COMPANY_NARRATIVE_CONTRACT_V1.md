# Company narrative contract v1

## Fresh semantic wire

Fresh Story is a semantic wire protocol. The provider may emit repeated blocks in
source order:

```text
[SCENE]
narrative text
[DIALOGUE speaker_id="registered_id"]
optional dialogue text
[ACTING] optional direction
[THOUGHT]
unquoted first-person player self-talk
[CHOICE]
literal player action text
```

`SCENE`, `DIALOGUE`, `THOUGHT`, and `CHOICE` each open an independent block and
implicitly close the prior content block. Closing markers are harmless control
syntax. `ACTING` is optional metadata attached only to the immediately adjacent
dialogue; it never carries across another semantic block. Raw Story is persisted
exactly, and parsed blocks preserve the exact source order.

Speaker authority is only `speaker_id`. It must be non-empty and either a
registered identity or `player`. Names, aliases, quotes, and previous-speaker
alternation never infer a speaker.

## Hard and soft boundaries

Hard Story failure is limited to integrity and authority violations: missing raw
Story/SCENE body, missing or unknown speaker ID, malformed control syntax,
unrecoverable dialogue text, or block/source-order corruption. These conditions
may produce `STORY_PROTOCOL_INVALID`.

Footer completeness is soft. A missing or duplicate THOUGHT, or a CHOICE count,
empty-text, or exact-duplicate problem, produces warnings while preserving raw
Story and observed blocks. No prior turn and no Extract result supplies missing
content. `player_inner_thought` is empty when absent.

Observed `choices` are the literal CHOICE blocks that occurred. `canonical_choices`
is available only when there are exactly four non-empty, non-duplicate choices;
only then may the player-action buttons consume them. Otherwise canonical choices
are unavailable and free input remains available.

## UI and historical compatibility

The UI owns headings, numbering, button sizing, and other presentation. Fresh
wire content contains no human section titles, numbered-choice contract, or
LLM-generated choice labels. Choice buttons always submit the full literal action
text. Extract never generates or falls back to choices.

Historical persisted Story rows may use the legacy parser at the persisted/read
compatibility boundary only. That adapter does not participate in Fresh writing,
Fresh validation, or Fresh speaker authority.
