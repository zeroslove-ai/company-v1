import bodyTypes from '../../content/body_types.json' with { type: 'json' };
import characters from '../../content/characters.json' with { type: 'json' };
import edition from '../../content/edition.json' with { type: 'json' };
import generalNpcs from '../../content/general_npcs.json' with { type: 'json' };
import map from '../../content/map.json' with { type: 'json' };
import organization from '../../content/organization.json' with { type: 'json' };
import positions from '../../content/positions.json' with { type: 'json' };
import speechStyles from '../../content/speech_styles.json' with { type: 'json' };
import { createCompanyR3Content } from './content.js';

// Bundlers include these imports in the Worker artifact; no runtime fs or shadow catalog is used.
export const companyR3WorkerContent = createCompanyR3Content({ edition, characters, generalNpcs, map, organization, positions, bodyTypes, speechStyles });

export function loadWorkerCanonicalContent() { return companyR3WorkerContent; }
