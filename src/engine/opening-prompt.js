import { buildActiveCharacterCanon } from './gameplay-state.js';
import { buildOpeningPlayerProjection } from './player-setup.js';
import { FRESH_MARKER_GRAMMAR, PROVIDER_CHOICE_OUTPUT_PROTOCOL } from './story-prompt.js';

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
  FRESH_MARKER_GRAMMAR,
  'Plain narrative is the default and stays in source order; [SCENE] may be used but is not required.',
  '[DIALOGUE speaker_id="..."]',
  'Actual spoken dialogue text.',
  '[/DIALOGUE]',
  '[ACTING]',
  'A standalone visible action narrative in source order; ACTING is not dialogue-direction metadata.',
  '[/ACTING]',
  '[THOUGHT] may be included as a short unquoted first-person Korean inner monologue written as natural self-talk, never analysis or report prose; choice validity is governed only by the mandatory protocol below.',
  PROVIDER_CHOICE_OUTPUT_PROTOCOL,
  'Every DIALOGUE speaker_id must copy one ID verbatim from the supplied allowed_speaker_ids list. Never use a character name, transformed or near-match ID, reordered string, invented ID, or inactive/unlisted ID.'
].join('\n');

const PLAYER_PRIVATE_OPENING_PREMISE = [
  'Player-private premise only: after accepting the job, the player noticed an unfamiliar app named 상식개변 on their phone despite having no memory of installing it. Its description claims it can change rules that people around the player accept as ordinary or natural.',
  'The player has never actually used the app yet. At this opening moment, the player is curious and slightly excited to see whether it really works in the company. The origin and mechanism of the app remain unknown.',
  'NPCs do not know the app exists. Nothing in reality has changed merely because the app exists. No CSA, institutional rule, relationship, event, or behavior change occurs until the player actually uses the app through the normal game mechanic.',
  'Let the first day unfold naturally from the supplied weekday, time, location, and active NPCs; leave the player free to decide what to do next.'
].join(' ');

const OPENING_DURABLE_RULES = [
  'Write natural Korean fiction from the canonical opening payload in the supplied company setting. Use the supplied weekday, time, and location as facts.',
  'Do not invent unregistered named characters or decide unrequested player actions. Show active characters through their characterization and dialogue.',
  'Canonical opening time and location are hard facts. Do not invent a different clock time or place. Do not mention apps, CSA, Worker, prompts, game mechanics, or system metadata as world knowledge; the opening is an in-world company scene.',
  PLAYER_PRIVATE_OPENING_PREMISE,
  'Use the output protocol below for dialogue identity and footer block structure. Speaker identity is the exact speaker_id marker, never a name or quote. In a fresh Opening, the only valid dialogue IDs are the verbatim values in the supplied allowed_speaker_ids list.',
  FRESH_OPENING_OUTPUT_PROTOCOL
].join('\n\n');

export function buildOpeningPrompt({ edition, player, canonical, openingPlan } = {}) {
  const charactersMap = edition?.characters?.characters ?? {};
  const activeIds = [openingPlan?.primary_character_id, ...(openingPlan?.supporting_character_ids ?? [])].filter(Boolean);
  const activeCharacterCanon = buildActiveCharacterCanon(charactersMap, activeIds);
  const allowedSpeakerIds = ['player', ...Object.keys(activeCharacterCanon)];
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
          location_name: openingPlan?.location_name
        },
        turn_context: {
          day: 1,
          minute_of_day: Number.isInteger(openingPlan?.minute_of_day) ? openingPlan.minute_of_day : null,
          location_id: openingPlan?.location_id ?? null,
          location_name: openingPlan?.location_name ?? null
        },
        cross_team_note: crossTeamNote,
        active_character_canon: activeCharacterCanon,
        allowed_speaker_ids: allowedSpeakerIds
      })
    }
  ];
}
