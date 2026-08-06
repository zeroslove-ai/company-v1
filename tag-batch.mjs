import { readFileSync, writeFileSync } from 'node:fs';
import { collectUnlabeledQuotes, buildTaggingMessages } from './src/engine/speaker-tagger.js';

const turns = JSON.parse(readFileSync('C:/Users/JAEWAN/projects/company-v1/turns-4.json', 'utf8'));
const master = { characters: [
  { character_id: 'heroine1', name: '서원희' },
  { character_id: 'heroine2', name: '윤민아' },
  { character_id: 'heroine3', name: '김제나' },
  { character_id: 'heroine4', name: '한리브' },
  { character_id: 'heroine5', name: '이메이' }
]};

const result = {};
for (const [tn, story] of Object.entries(turns)) {
  const quotes = collectUnlabeledQuotes(story);
  const msgs = quotes.length ? buildTaggingMessages(story, master) : null;
  result[tn] = { quotes: quotes.map(q => ({ index: q.index, text: q.text, context: q.context.slice(-120) })), msgs };
}
writeFileSync('C:/Users/JAEWAN/projects/company-v1/tag-batch.json', JSON.stringify(result, null, 1), 'utf8');
for (const [tn, r] of Object.entries(result)) {
  console.log(`Turn ${tn}: 무명 대사 ${r.quotes.length}개`);
  for (const q of r.quotes) console.log(`  [${q.index}] ${q.text.slice(0, 32)}`);
}
