import { createApiClient } from './api.js';
import { FRONTEND_CONFIG } from './config.js';
import { renderHistory, text } from './render.js';

function resolveGameId() {
  const value = new URL(globalThis.location?.href ?? 'https://local.invalid/').searchParams.get('game');
  return value || FRONTEND_CONFIG.defaultGameId;
}

function safe(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function choices(record) {
  const source = Array.isArray(record?.parsed_blocks?.choices)
    ? record.parsed_blocks.choices
    : Array.isArray(record?.choices) ? record.choices : [];
  return source.filter(item => typeof item === 'string' && item.trim());
}

function innerThought(record) {
  return safe(record?.player_inner_thought) || safe(record?.parsed_blocks?.player_inner_thought);
}

function playerStatus(record) {
  return safe(record?.parsed_blocks?.player_status);
}

export function mergeHistoryRecords(current, incoming) {
  const map = new Map();
  for (const item of [...(current ?? []), ...(incoming ?? [])]) {
    if (!Number.isInteger(item?.turn_number)) continue;
    map.set(item.turn_number, item);
  }
  return [...map.values()].sort((a, b) => b.turn_number - a.turn_number);
}

export function historyPageState(result = {}) {
  const nextBeforeTurn = Number.isInteger(result.next_before_turn) && result.next_before_turn > 0
    ? result.next_before_turn
    : null;
  const hasMore = result.has_more === true && nextBeforeTurn !== null;
  return { next_before_turn: nextBeforeTurn, has_more: hasMore, hide_more: !hasMore };
}

export function formatHistoryMarkdown(records, title = '상식개변: 회사편 플레이 기록') {
  const lines = [`# ${title}`, ''];
  for (const record of [...(records ?? [])].sort((a, b) => a.turn_number - b.turn_number)) {
    lines.push(`## Turn ${record.turn_number}`, '');
    const action = safe(record.player_action ?? record.player_input);
    if (action) lines.push('### 플레이어 행동', '', action, '');
    const story = safe(record.story_text);
    if (story) lines.push('### 서사', '', story, '');
    const thought = innerThought(record);
    if (thought) lines.push('### 플레이어 속마음', '', thought, '');
    const status = playerStatus(record);
    if (status) lines.push('### 플레이어 상황', '', status, '');
    const list = choices(record);
    if (list.length) {
      lines.push('### 선택지', '');
      list.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
      lines.push('');
    }
    const summary = safe(record.turn_summary);
    if (summary) lines.push('### 턴 요약', '', summary, '');
    lines.push('---', '');
  }
  return lines.join('\n').trimEnd() + '\n';
}

export function formatHistoryText(records, title = '상식개변: 회사편 플레이 기록') {
  const lines = [title, '='.repeat(title.length), ''];
  for (const record of [...(records ?? [])].sort((a, b) => a.turn_number - b.turn_number)) {
    lines.push(`[Turn ${record.turn_number}]`);
    const action = safe(record.player_action ?? record.player_input);
    if (action) lines.push(`플레이어 행동: ${action}`);
    const story = safe(record.story_text);
    if (story) lines.push('', story);
    const thought = innerThought(record);
    if (thought) lines.push('', `플레이어 속마음: ${thought}`);
    const status = playerStatus(record);
    if (status) lines.push(`플레이어 상황: ${status}`);
    const list = choices(record);
    if (list.length) {
      lines.push('', '선택지:');
      list.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
    }
    const summary = safe(record.turn_summary);
    if (summary) lines.push('', `턴 요약: ${summary}`);
    lines.push('', '-'.repeat(48), '');
  }
  return lines.join('\n').trimEnd() + '\n';
}

function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function installHistoryTools({ documentRef = document, api = createApiClient(), gameId = resolveGameId() } = {}) {
  const open = documentRef.querySelector('#open-history');
  const overlay = documentRef.querySelector('#history-overlay');
  const close = documentRef.querySelector('#history-close');
  const list = documentRef.querySelector('#history-list');
  const more = documentRef.querySelector('#history-more');
  const status = documentRef.querySelector('#history-status');
  const md = documentRef.querySelector('#history-download-md');
  const txt = documentRef.querySelector('#history-download-txt');
  if (!open || !overlay || !close || !list || !more || !status) return null;

  let records = [];
  let nextBeforeTurn = null;
  let loading = false;

  function setLoading(value) {
    loading = value;
    more.disabled = value;
    if (md) md.disabled = value;
    if (txt) txt.disabled = value;
  }

  async function loadPage({ reset = false } = {}) {
    if (loading) return;
    if (reset) {
      records = [];
      nextBeforeTurn = null;
      list.replaceChildren();
    }
    setLoading(true);
    text(status, '기록을 불러오는 중…');
    try {
      const result = await api.history({ game_id: gameId, limit: 20, ...(nextBeforeTurn ? { before_turn: nextBeforeTurn } : {}) });
      records = mergeHistoryRecords(records, result.records ?? []);
      const pageState = historyPageState(result);
      nextBeforeTurn = pageState.next_before_turn;
      renderHistory(list, records, { showSummary: true });
      more.hidden = pageState.hide_more;
      text(status, records.length ? `${records.length}개 턴` : '저장된 기록이 없습니다.');
    } catch (error) {
      text(status, '기록을 불러오지 못했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function fetchAll() {
    let all = [];
    let cursor = null;
    const seen = new Set();
    for (let page = 0; page < 1000; page += 1) {
      const result = await api.history({ game_id: gameId, limit: 50, ...(cursor ? { before_turn: cursor } : {}) });
      all = mergeHistoryRecords(all, result.records ?? []);
      const pageState = historyPageState(result);
      const next = pageState.next_before_turn;
      if (!pageState.has_more || !next || seen.has(next)) break;
      seen.add(next);
      cursor = next;
    }
    return all;
  }

  async function download(format) {
    if (loading) return;
    setLoading(true);
    text(status, '전체 기록을 준비하는 중…');
    try {
      const all = await fetchAll();
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'md') downloadText(`company-v1-history-${stamp}.md`, formatHistoryMarkdown(all), 'text/markdown');
      else downloadText(`company-v1-history-${stamp}.txt`, formatHistoryText(all), 'text/plain');
      text(status, `${all.length}개 턴 다운로드를 시작했습니다.`);
    } finally {
      setLoading(false);
    }
  }

  open.addEventListener('click', event => {
    event.stopImmediatePropagation();
    overlay.hidden = false;
    loadPage({ reset: true }).catch(() => undefined);
  }, true);
  close.addEventListener('click', event => {
    event.stopImmediatePropagation();
    overlay.hidden = true;
  }, true);
  more.addEventListener('click', event => {
    event.stopImmediatePropagation();
    loadPage().catch(() => undefined);
  }, true);
  md?.addEventListener('click', event => {
    event.stopImmediatePropagation();
    download('md').catch(() => text(status, 'MD 다운로드에 실패했습니다.'));
  }, true);
  txt?.addEventListener('click', event => {
    event.stopImmediatePropagation();
    download('txt').catch(() => text(status, 'TXT 다운로드에 실패했습니다.'));
  }, true);

  return { loadPage, fetchAll, getRecords: () => [...records] };
}

if (typeof document !== 'undefined') installHistoryTools();
