import { createEditionAdapter } from '../engine/index.js';
import editionContent from '../../content/edition.json' with { type: 'json' };
import organization from '../../content/organization.json' with { type: 'json' };
import map from '../../content/map.json' with { type: 'json' };
import characters from '../../content/characters.json' with { type: 'json' };
import generalNpcs from '../../content/general_npcs.json' with { type: 'json' };
import csaPresets from '../../content/csa_presets.json' with { type: 'json' };
import positions from '../../content/positions.json' with { type: 'json' };
import bodyTypes from '../../content/body_types.json' with { type: 'json' };
import speechStyles from '../../content/speech_styles.json' with { type: 'json' };

const edition = createEditionAdapter({
  editionId: editionContent.edition_id,
  contentVersion: editionContent.content_version,
  organization,
  map,
  characters,
  generalNpcs,
  csaPresets,
  positions,
  bodyTypes,
  speechStyles
});

export default edition;
