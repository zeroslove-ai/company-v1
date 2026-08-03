const NAME_MAX = 20;
const HEIGHT_RANGE = [140, 220];
const WEIGHT_RANGE = [40, 180];
const PENIS_LENGTH_RANGE = [5, 30];

function inRange(value, [min, max]) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function idSet(list, idField) {
  return new Set((Array.isArray(list) ? list : []).map(item => item?.[idField]));
}

/**
 * Client-side pre-check only, purely for UX. The server re-validates every field
 * against the same catalogs and never trusts this result.
 */
export function validateSetupValues(values, catalogs = {}) {
  const errors = [];
  const name = typeof values?.name === 'string' ? values.name.trim() : '';
  if (!name || name.length > NAME_MAX) errors.push('invalid_name');

  const heightCm = Number(values?.height_cm);
  if (!inRange(heightCm, HEIGHT_RANGE)) errors.push('invalid_height_cm');
  const weightKg = Number(values?.weight_kg);
  if (!inRange(weightKg, WEIGHT_RANGE)) errors.push('invalid_weight_kg');
  const penisLengthCm = Number(values?.penis_length_cm);
  if (!inRange(penisLengthCm, PENIS_LENGTH_RANGE)) errors.push('invalid_penis_length_cm');

  if (!idSet(catalogs.departments, 'department_id').has(values?.department_id)) errors.push('invalid_department_id');
  if (!idSet(catalogs.positions, 'position_id').has(values?.position_id)) errors.push('invalid_position_id');
  if (!idSet(catalogs.bodyTypes, 'body_type_id').has(values?.body_type_id)) errors.push('invalid_body_type_id');
  if (!idSet(catalogs.speechStyles, 'speech_style_id').has(values?.speech_style_id)) errors.push('invalid_speech_style_id');

  if (errors.length > 0) return { valid: false, errors, player: null };
  return {
    valid: true,
    errors: [],
    player: {
      name,
      department_id: values.department_id,
      position_id: values.position_id,
      height_cm: heightCm,
      weight_kg: weightKg,
      penis_length_cm: penisLengthCm,
      body_type_id: values.body_type_id,
      speech_style_id: values.speech_style_id
    }
  };
}

/** ui_hint is a short UI-only label; it is never part of the submitted payload or any prompt. */
export function catalogOptions(list, idField) {
  return (Array.isArray(list) ? list : []).map(item => ({
    value: item?.[idField],
    label: item?.ui_hint ? `${item.name} (${item.ui_hint})` : item?.name
  }));
}
