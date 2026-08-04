export const DEPARTMENTS = [
  { department_id: 'brand_strategy', name: '브랜드전략팀', ui_hint: '히로인 5명' },
  { department_id: 'audit', name: '감사실', ui_hint: '조사 권한' },
  { department_id: 'human_resources', name: '인사팀', ui_hint: '인사 정보' },
  { department_id: 'new_business_tf', name: '신사업TF', ui_hint: '신규 사업' },
  { department_id: 'finance_planning', name: '재무기획팀', ui_hint: '예산 권한' },
  { department_id: 'public_relations', name: '홍보팀', ui_hint: '외부 대응' }
];

export const POSITIONS = [
  { position_id: 'intern', name: '인턴', ui_hint: '신입 관찰' },
  { position_id: 'assistant_manager', name: '대리', ui_hint: '실무 중심' },
  { position_id: 'tf_lead', name: 'TF팀장', ui_hint: '조율 권한' },
  { position_id: 'executive', name: '임원', ui_hint: '전략 권한' }
];

export const BODY_TYPES = [
  { body_type_id: 'balanced', name: '균형 잡힌 체형' },
  { body_type_id: 'muscular', name: '근육질' },
  { body_type_id: 'athletic', name: '탄탄한 체형' },
  { body_type_id: 'slender', name: '호리호리한 체형' },
  { body_type_id: 'large_frame', name: '큰 체격' }
];

export const SPEECH_STYLES = [
  { speech_style_id: 'polite', name: '정중한 존댓말' },
  { speech_style_id: 'calm', name: '차분한 말투' },
  { speech_style_id: 'friendly', name: '친근한 말투' },
  { speech_style_id: 'playful', name: '능글맞은 말투' },
  { speech_style_id: 'cold', name: '냉정한 말투' },
  { speech_style_id: 'rough_yangachi', name: '거친 양아치 말투' }
];

// Display-only identity projection. The Company engine and save remain the authority.
export const CHARACTERS = [
  { character_id: 'heroine1', name: '서원희' },
  { character_id: 'heroine2', name: '윤민아' },
  { character_id: 'heroine3', name: '김제나' },
  { character_id: 'heroine4', name: '한리브' },
  { character_id: 'heroine5', name: '이메이' }
];

export const CATALOGS = {
  departments: DEPARTMENTS,
  positions: POSITIONS,
  bodyTypes: BODY_TYPES,
  speechStyles: SPEECH_STYLES,
  characters: CHARACTERS
};
