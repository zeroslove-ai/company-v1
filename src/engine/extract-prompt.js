export function buildExtractPrompt({ context, storyText, parsedStory, playerAction, expectedTurn }) {
  return [
    {
      role: 'system',
      content: [
        'Return one JSON object only.',
        'Use state_delta for changed values only; never return a full save.',
        'Do not invent actions or outcomes absent from Story.',
        'Use one graded outcome: success, partial, refused, interrupted, or blocked.',
        'Keep choices from Story, omit uncertain values, and do not auto-link relationship, emotion, or CSA values.',
        'The object must include state_delta (object), outcome, evidence (object), turn_summary (string), mind_monitor (object), choices (array), and dialogue_lines (array).'
      ].join(' ')
    },
    {
      role: 'user',
      content: JSON.stringify({ expected_turn: expectedTurn, player_action: playerAction, context, story_text: storyText, parsed_story: parsedStory })
    }
  ];
}
