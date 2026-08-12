import { buildActiveCharacterCanon } from './gameplay-state.js';
import { buildOpeningPlayerProjection } from './player-setup.js';

const BACKGROUND_MAX = 120;
const OPENING_BODY_HEADER = '[1. \uC11C\uC0AC \uBC0F \uD589\uB3D9]';

// Historical response helper. Fresh opening calls no longer use this grammar.
export function splitOpeningSections(rawText) {
  const raw = String(rawText ?? '');
  const bodyIndex = raw.indexOf(OPENING_BODY_HEADER);
  const head = bodyIndex === -1 ? raw : raw.slice(0, bodyIndex);
  const body = bodyIndex === -1 ? '' : raw.slice(bodyIndex);
  const backgroundMatch = /\[\uBC30\uACBD\]\s*([\s\S]*)/.exec(head);
  const rawBackground = (backgroundMatch ? backgroundMatch[1] : head).trim();
  const truncated = Array.from(rawBackground).length > BACKGROUND_MAX;
  const background = truncated ? `${Array.from(rawBackground).slice(0, BACKGROUND_MAX - 1).join('')}…` : rawBackground;
  return { background, body, warnings: truncated ? ['opening_background_truncated'] : [] };
}

const FRESH_OPENING_OUTPUT_PROTOCOL = [
  'Fresh opening semantic wire protocol:',
  '[SCENE] opening narrative [/SCENE] (closing marker optional).',
  '[DIALOGUE speaker_id="registered_id_or_player"] followed optionally by [ACTING] direction and dialogue text.',
  '[THOUGHT] one unquoted first-person Korean inner monologue written as natural self-talk, never analysis or report prose.',
  'Then provide exactly four repeated [CHOICE] blocks, each containing one concrete literal player action (usually around 30 Korean characters as quality guidance only; not a validity gate). Every speaker_id is an exact registered ID; never infer a speaker. The UI owns headings and numbering; do not output labels, human section titles, or numbered choices.'
].join('\n');

const PLAYER_PRIVATE_OPENING_PREMISE = [
  'Player-private premise only: after accepting the job, the player noticed an unfamiliar app named 상식개변 on their phone despite having no memory of installing it. Its description claims it can change rules that people around the player accept as ordinary or natural.',
  'The player has never actually used the app yet. On the first day of work, the player is curious and slightly excited to see whether it really works in the company. The origin and mechanism of the app remain unknown.',
  'NPCs do not know the app exists. Nothing in reality has changed merely because the app exists. No CSA, institutional rule, relationship, event, or behavior change occurs until the player actually uses the app through the normal game mechanic.',
  'Let the first day unfold naturally from the supplied workplace facts, location, work hook, scene goal, and active NPCs; leave the player free to decide what to do next.'
].join(' ');

const OPENING_DURABLE_RULES = [
  'Write natural Korean workplace fiction from the canonical opening payload. Use the supplied weekday, time, location, work hook, and scene goal as facts.',
  'Do not invent unregistered named characters or decide unrequested player actions. Show active NPC motives through natural work and dialogue.',
  PLAYER_PRIVATE_OPENING_PREMISE,
  'Use only the semantic wire blocks described below. Speaker identity is the exact speaker_id marker, never a name or quote.',
  FRESH_OPENING_OUTPUT_PROTOCOL
].join('\n\n');

export function buildOpeningPrompt({ edition, player, canonical, openingPlan } = {}) {
  const charactersMap = edition?.characters?.characters ?? {};
  const activeIds = [openingPlan?.primary_character_id, ...(openingPlan?.supporting_character_ids ?? [])].filter(Boolean);
  const crossTeamNote = player?.position_id === 'tf_lead' && player?.department_id === 'brand_strategy'
    ? 'This TF lead is a separate project or cross-team collaboration role and does not replace the brand-strategy team lead.'
    : null;
  return [
    { role: 'system', content: OPENING_DURABLE_RULES },
    {
      role: 'user',
      content: JSON.stringify({
        edition: edition.editionId,
        player: buildOpeningPlayerProjection({ player, canonical }),
        opening_plan: {
          weekday: openingPlan?.weekday, minute_of_day: openingPlan?.minute_of_day,
          location_name: openingPlan?.location_name, work_hook_label: openingPlan?.work_hook_label,
          scene_goal: openingPlan?.scene_goal
        },
        cross_team_note: crossTeamNote,
        active_character_canon: buildActiveCharacterCanon(charactersMap, activeIds)
      })
    }
  ];
}
