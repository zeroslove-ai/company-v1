export function buildStoryPrompt({ edition, context, playerAction, expectedTurn }) {
  const relevant = {
    game: context.game,
    save: context.save,
    recent_turns: context.recent_turns
  };
  return [
    {
      role: 'system',
      content: [
        'You write one Korean company-game turn.',
        'Return only narrative markers: [SCENE], [DIALOGUE speaker="..." direction="..."], [PLAYER_STATUS], and [CHOICES].',
        'Keep chronology, use only context NPCs and active CSA, and provide exactly four choices.',
        'Do not invent player dialogue, state field names, validation steps, JSON, or explanations.'
      ].join(' ')
    },
    {
      role: 'user',
      content: JSON.stringify({ edition: edition.editionId, expected_turn: expectedTurn, player_action: playerAction, context: relevant })
    }
  ];
}
