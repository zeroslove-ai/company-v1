import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCompanyR3Content } from './content.js';

function readJson(root, name) { return JSON.parse(readFileSync(join(root, 'content', name), 'utf8')); }

export function loadCanonicalCompanyR3Content(root = process.cwd()) {
  return createCompanyR3Content({
    edition: readJson(root, 'edition.json'),
    characters: readJson(root, 'characters.json'),
    generalNpcs: readJson(root, 'general_npcs.json'),
    map: readJson(root, 'map.json'),
    organization: readJson(root, 'organization.json'),
    positions: readJson(root, 'positions.json'),
    bodyTypes: readJson(root, 'body_types.json'),
    speechStyles: readJson(root, 'speech_styles.json')
  });
}
