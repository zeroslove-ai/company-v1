const NAME_MAX = 20;
const RANGES = Object.freeze({ age: [18, 70], height_cm: [140, 220], weight_kg: [40, 180], penis_length_cm: [5, 30] });

function integerInRange(value, [min, max]) { return Number.isInteger(value) && value >= min && value <= max; }
function ids(list, field) { return new Set((Array.isArray(list) ? list : []).map(item => item?.[field])); }

export function validateProfile(input, content) {
  const errors = [];
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > NAME_MAX) errors.push('invalid_name');
  for (const [field, range] of Object.entries(RANGES)) {
    const value = Number(input?.[field]);
    if (!integerInRange(value, range)) errors.push(`invalid_${field}`);
  }
  for (const [field, list, idField] of [
    ['department_id', content?.departments, 'department_id'],
    ['position_id', content?.positions, 'position_id'],
    ['body_type_id', content?.bodyTypes, 'body_type_id'],
    ['speech_style_id', content?.speechStyles, 'speech_style_id']
  ]) if (!ids(list, idField).has(input?.[field])) errors.push(`invalid_${field}`);
  if (errors.length) return { valid: false, errors, profile: null };
  return { valid: true, errors: [], profile: {
    name,
    department_id: input.department_id,
    position_id: input.position_id,
    age: Number(input.age),
    height_cm: Number(input.height_cm),
    weight_kg: Number(input.weight_kg),
    penis_length_cm: Number(input.penis_length_cm),
    body_type_id: input.body_type_id,
    speech_style_id: input.speech_style_id
  } };
}

export function catalogOptions(list, idField) {
  return (Array.isArray(list) ? list : []).map(item => ({ value: item?.[idField], label: item?.ui_hint ? `${item.name} (${item.ui_hint})` : item?.name }));
}
