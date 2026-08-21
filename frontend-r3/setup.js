const NAME_MAX = 20;
const AGE_RANGE = [18, 70];
const HEIGHT_RANGE = [140, 220];
const WEIGHT_RANGE = [40, 180];
const PENIS_LENGTH_RANGE = [5, 30];

function inRange(value, [min, max]) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function idSet(list, idField) {
  return new Set((Array.isArray(list) ? list : []).map(item => item?.[idField]));
}

// Client validation is a donor-style UX pre-check only. The R3 server validates
// the same complete profile again before creating a game.
export function validateSetupValues(values, catalogs = {}) {
  const errors = [];
  const name = typeof values?.name === 'string' ? values.name.trim() : '';
  if (!name || name.length > NAME_MAX) errors.push('invalid_name');
  const age = Number(values?.age);
  const heightCm = Number(values?.height_cm);
  const weightKg = Number(values?.weight_kg);
  const penisLengthCm = Number(values?.penis_length_cm);
  if (!inRange(age, AGE_RANGE)) errors.push('invalid_age');
  if (!inRange(heightCm, HEIGHT_RANGE)) errors.push('invalid_height_cm');
  if (!inRange(weightKg, WEIGHT_RANGE)) errors.push('invalid_weight_kg');
  if (!inRange(penisLengthCm, PENIS_LENGTH_RANGE)) errors.push('invalid_penis_length_cm');
  if (!idSet(catalogs.departments, 'department_id').has(values?.department_id)) errors.push('invalid_department_id');
  if (!idSet(catalogs.positions, 'position_id').has(values?.position_id)) errors.push('invalid_position_id');
  if (!idSet(catalogs.body_types, 'body_type_id').has(values?.body_type_id)) errors.push('invalid_body_type_id');
  if (!idSet(catalogs.speech_styles, 'speech_style_id').has(values?.speech_style_id)) errors.push('invalid_speech_style_id');
  if (errors.length) return { valid: false, errors, player: null };
  return { valid: true, errors: [], player: {
    name, department_id: values.department_id, position_id: values.position_id,
    age, height_cm: heightCm, weight_kg: weightKg, penis_length_cm: penisLengthCm,
    body_type_id: values.body_type_id, speech_style_id: values.speech_style_id
  } };
}

export function catalogOptions(list, idField) {
  return (Array.isArray(list) ? list : []).map(item => ({
    value: item?.[idField],
    label: item?.ui_hint ? `${item.name} (${item.ui_hint})` : item?.name
  }));
}

export function readSetupForm(document = globalThis.document) {
  const value = id => document?.querySelector?.(`#${id}`)?.value ?? '';
  return {
    name: value('setup-name'), department_id: value('setup-department'), position_id: value('setup-position'),
    age: Number(value('setup-age')), height_cm: Number(value('setup-height')), weight_kg: Number(value('setup-weight')),
    penis_length_cm: Number(value('setup-penis-length')), body_type_id: value('setup-body-type'), speech_style_id: value('setup-speech-style')
  };
}

export function renderSetupCatalogs(document = globalThis.document, catalogs = {}) {
  const fields = [
    ['setup-department', catalogs.departments, 'department_id'],
    ['setup-position', catalogs.positions, 'position_id'],
    ['setup-body-type', catalogs.body_types, 'body_type_id'],
    ['setup-speech-style', catalogs.speech_styles, 'speech_style_id']
  ];
  for (const [id, items, key] of fields) {
    const select = document?.querySelector?.(`#${id}`);
    if (!select) continue;
    select.replaceChildren(...catalogOptions(items, key).map(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value ?? '';
      option.textContent = optionData.label ?? optionData.value ?? '';
      return option;
    }));
  }
}
