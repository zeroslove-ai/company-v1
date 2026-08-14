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
  'Fresh opening output protocol:',
  'Plain narrative is the default and stays in source order; [SCENE] may be used but is not required.',
  '[DIALOGUE speaker_id="registered_id_or_player"]',
  'Actual spoken dialogue text.',
  '[/DIALOGUE]',
  '[ACTING]',
  'A standalone visible action narrative in source order; ACTING is not dialogue-direction metadata.',
  '[/ACTING]',
  '[THOUGHT] one unquoted first-person Korean inner monologue written as natural self-talk, never analysis or report prose.',
  'Output exactly four repeated [CHOICE] blocks. Each [CHOICE] must contain one non-empty concrete literal player action; do not number choices yourself and do not output a human choice heading or numbered list because the UI owns numbering. When possible, provide one [THOUGHT] as well (quality guidance only; not a validity gate). Every speaker_id is an exact registered ID; never infer a speaker.'
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
  'Canonical opening time and location are hard facts. Do not invent a different clock time or place. Do not mention apps, CSA, Worker, prompts, game mechanics, or system metadata as world knowledge; the opening is an in-world workplace scene.',
  PLAYER_PRIVATE_OPENING_PREMISE,
  'Use the output protocol below for dialogue identity and optional footer blocks. Speaker identity is the exact speaker_id marker, never a name or quote.',
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
        turn_context: {
          day: 1,
          minute_of_day: Number.isInteger(openingPlan?.minute_of_day) ? openingPlan.minute_of_day : null,
          location_id: openingPlan?.location_id ?? null,
          location_name: openingPlan?.location_name ?? null
        },
        cross_team_note: crossTeamNote,
        active_character_canon: buildActiveCharacterCanon(charactersMap, activeIds)
      })
    }
  ];
}
