import { createHash, randomUUID } from 'node:crypto';
import { observerSystemPrompt, storySystemPrompt } from '../prompts/story.js';

const TIMEOUT_MS = Object.freeze({ story: 120_000, observer: 75_000 });
const FIRST_STORY_CONTENT_MS = 30_000;

function payloadAudit(payload, stage, providerMode = 'company-configured') {
  const userMessage = payload.messages?.find(message => message.role === 'user')?.content ?? '';
  let requestData = {};
  try { requestData = JSON.parse(userMessage); } catch { /* retain hashes if format ever changes */ }
  const context = requestData.context ?? {};
  return {
    provider_mode: providerMode,
    actual_http_request: providerMode === 'company-configured',
    stage,
    model: payload.model,
    payload_sha256: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    user_message_sha256: createHash('sha256').update(String(userMessage)).digest('hex'),
    command: requestData.structured_command ?? {
      kind: context.current_authority?.kind ?? '',
      literal_action: requestData.literal_action ?? '',
      rule_change: context.current_authority?.rule_change ?? null
    },
    world_premise: context.world_premise ?? null,
    current_authority: context.current_authority ?? null,
    active_rules: context.active_rules ?? [],
    historical_rule_events: context.historical_rule_events ?? [],
    rule_change_event: context.rule_change_event ?? null,
    official_announcement: context.official_announcement ?? null,
    source_characters: (context.registered_characters ?? []).map(actor => ({
      actor_id: actor.actor_id,
      name: actor.name,
      age: actor.age,
      department: actor.department,
      position: actor.position,
      role_title: actor.role_title,
      dramatization: actor.dramatization ?? null
    }))
  };
}

function configuration(env) {
  const baseUrl = String(env.LLM_API_URL ?? '').replace(/\/$/, '');
  const apiKey = String(env.LLM_API_KEY ?? env.DEEPSEEK_API_KEY ?? '');
  const storyModel = String(env.STORY_MODEL ?? '');
  const observerModel = String(env.EXTRACT_MODEL ?? '');
  const ready = Boolean(baseUrl && apiKey && storyModel && observerModel);
  return { ready, baseUrl, apiKey, storyModel, observerModel };
}

function getCompletionUrl(baseUrl) {
  return baseUrl.endsWith('/chat/completions') ? baseUrl : baseUrl + '/chat/completions';
}

export function createConfiguredProvider({ env = process.env, fetchImpl = fetch, onModelCall = null } = {}) {
  const config = configuration(env);
  if (!config.ready) throw new Error('company_model_configuration_unavailable');

  async function request(stage, model, payload, gameId, commandId, jobId) {
    const callId = onModelCall?.start
      ? await onModelCall.start({ callId: randomUUID(), gameId, commandId, jobId, stage, model })
      : randomUUID();
    const controller = new AbortController();
    let timeoutCode = '';
    const totalTimer = setTimeout(() => {
      timeoutCode = 'provider_timeout';
      controller.abort(new Error(timeoutCode));
    }, TIMEOUT_MS[stage]);
    const firstTimer = stage === 'story' ? setTimeout(() => {
      if (!timeoutCode) {
        timeoutCode = 'provider_first_content_timeout';
        controller.abort(new Error(timeoutCode));
      }
    }, FIRST_STORY_CONTENT_MS) : null;
    try {
      const response = await fetchImpl(getCompletionUrl(config.baseUrl), {
        method: 'POST',
        headers: { authorization: 'Bearer ' + config.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      let finished = false;
      const finish = async values => {
        if (finished) return;
        finished = true;
        if (onModelCall?.finish) await onModelCall.finish(callId, values);
      };
      if (!response.ok) {
        await finish({ status: 'failed', errorCode: 'provider_http_' + response.status });
        throw new Error('provider_http_' + response.status);
      }
      return {
        response,
        finish,
        markFirstContent: () => { if (firstTimer) clearTimeout(firstTimer); },
        timedOut: () => timeoutCode,
        clearTimers: () => { clearTimeout(totalTimer); if (firstTimer) clearTimeout(firstTimer); }
      };
    } catch (error) {
      clearTimeout(totalTimer);
      if (firstTimer) clearTimeout(firstTimer);
      if (error?.message?.startsWith('provider_http_')) throw error;
      if (onModelCall?.finish) await onModelCall.finish(callId, {
        status: 'failed',
        errorCode: timeoutCode || (controller.signal.aborted ? 'provider_timeout' : 'provider_connection_failed')
      });
      throw new Error(timeoutCode || (controller.signal.aborted ? 'provider_timeout' : 'provider_connection_failed'));
    }
  }

  return {
    mode: 'company-configured',
    modelNames: { story: config.storyModel, observer: config.observerModel },
    async story({ context, command, jobId, feedbackText = '', feedbackReferenceStory = '', onChunk = null, onPayload = null }) {
      const requestPayload = {
        model: config.storyModel,
        stream: true,
        stream_options: { include_usage: true },
        thinking: { type: 'disabled' },
        max_tokens: 3500,
        messages: [
          { role: 'system', content: storySystemPrompt() },
          { role: 'user', content: JSON.stringify({
            context,
            structured_command: command,
            literal_action: command.literal_action,
            feedback_text: feedbackText,
            feedback_reference_story: feedbackReferenceStory
          }) }
        ]
      };
      onPayload?.(payloadAudit(requestPayload, 'story'));
      const call = await request('story', config.storyModel, requestPayload, command.game_id, command.command_id, jobId);
      let inputTokens = null;
      let outputTokens = null;
      try {
        if (!call.response.body) throw new Error('provider_stream_body_missing');
        const reader = call.response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let text = '';
        let finishReason = '';
        let doneMarker = false;
        const processEvent = async event => {
          const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
          if (!data) return;
          if (data === '[DONE]') { doneMarker = true; return; }
          let payload;
          try { payload = JSON.parse(data); } catch { throw new Error('provider_sse_json_invalid'); }
          if (Number.isInteger(payload.usage?.prompt_tokens)) inputTokens = payload.usage.prompt_tokens;
          if (Number.isInteger(payload.usage?.completion_tokens)) outputTokens = payload.usage.completion_tokens;
          const choice = payload.choices?.[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          const delta = choice?.delta?.content;
          if (typeof delta === 'string' && delta) {
            text += delta;
            call.markFirstContent();
            onChunk?.(delta);
          } else if (Array.isArray(delta)) {
            for (const item of delta) {
              if (typeof item?.text !== 'string') continue;
              text += item.text;
              call.markFirstContent();
              onChunk?.(item.text);
            }
          }
        };
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? '';
          for (const event of events) await processEvent(event);
          if (done) break;
        }
        if (buffer.trim()) await processEvent(buffer);
        if (!doneMarker || finishReason !== 'stop' || !text.trim()) {
          const code = finishReason === 'length' ? 'story_output_limit' : 'story_stream_incomplete';
          await call.finish({ status: 'failed', finishReason: finishReason || null, errorCode: code, inputTokens, outputTokens });
          throw new Error(code);
        }
        await call.finish({ status: 'complete', finishReason, inputTokens, outputTokens });
        return text;
      } catch (error) {
        if (!['story_output_limit', 'story_stream_incomplete'].includes(error.message)) {
          const code = call.timedOut() || error.message || 'story_stream_read_failed';
          await call.finish({ status: 'failed', errorCode: code, inputTokens, outputTokens });
          throw new Error(code);
        }
        throw error;
      } finally {
        call.clearTimers();
      }
    },
    async observe({ storyText, context, command, jobId, onPayload = null }) {
      const requestPayload = {
        model: config.observerModel,
        stream: false,
        max_tokens: 2400,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: observerSystemPrompt() },
          { role: 'user', content: JSON.stringify({ context, current_literal_action: command.literal_action, completed_story: storyText }) }
        ]
      };
      onPayload?.(payloadAudit(requestPayload, 'observer'));
      const call = await request('observer', config.observerModel, requestPayload, command.game_id, command.command_id, jobId);
      try {
        const payload = await call.response.json();
        const choice = payload.choices?.[0];
        if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') {
          const failureCode = choice?.finish_reason && choice.finish_reason !== 'stop'
            ? 'observer_finish_' + choice.finish_reason
            : typeof choice?.message?.content !== 'string' ? 'observer_content_missing' : 'observer_incomplete';
          await call.finish({
            status: 'failed',
            finishReason: choice?.finish_reason ?? null,
            errorCode: failureCode,
            inputTokens: payload.usage?.prompt_tokens ?? null,
            outputTokens: payload.usage?.completion_tokens ?? null
          });
          throw new Error(failureCode);
        }
        await call.finish({
          status: 'complete',
          finishReason: choice.finish_reason,
          inputTokens: payload.usage?.prompt_tokens ?? null,
          outputTokens: payload.usage?.completion_tokens ?? null
        });
        return choice.message.content;
      } catch (error) {
        if (!String(error.message).startsWith('observer_')) {
          await call.finish({ status: 'failed', errorCode: call.timedOut() || 'observer_response_invalid' });
        }
        throw error;
      } finally {
        call.clearTimers();
      }
    }
  };
}

function scriptedStory({ context, command }) {
  const location = context.current_location?.name ?? '회사 본관';
  const present = [...(context.scene.present_actor_ids ?? [])];
  const byId = new Map(context.registered_characters.map(actor => [actor.actor_id, actor]));
  const openingActor = command.kind === 'OPENING'
    ? context.registered_characters.find(actor => actor.kind === 'heroine' && actor.default_location_id === context.scene.location_id)
    : null;
  if (openingActor && !present.includes(openingActor.actor_id)) present.push(openingActor.actor_id);
  const names = present.map(id => byId.get(id)?.name).filter(Boolean);
  const lead = openingActor?.name ?? names[0] ?? '';
  const notice = /공지|알림|사내 메신저/.test(command.literal_action ?? '');
  const appName = context.world_premise?.app_name ?? '상식개변';
  const line = command.kind === 'OPENING'
    ? '잠금 화면 한쪽에 낯선 앱, ‘' + appName + '’의 아이콘이 조용히 나타나 있다. 그 존재를 아는 것은 플레이어뿐이다.'
    : notice ? '사내 메신저에 점심 메뉴 공지가 도착했다.' : '당신은 가볍게 말을 꺼냈고, 대화 사이에 잠시 생각하는 틈이 생겼다.';
  const personLine = openingActor
    ? [openingActor.source_record?.prompt_card?.identity, openingActor.source_record?.prompt_card?.appearance].filter(Boolean).join(' ')
    : names.length
      ? names.map(name => name + '은 대화를 이어갈 수 있는 거리에 남아 있다.').join(' ')
      : '장면에는 확인된 출연 인물이 없다.';
  const locationQuote = '지금은 ' + location + '에서 이야기가 이어진다.';
  const presenceQuote = names.length
    ? names.map(name => '현장에는 ' + name + '이 남아 있다.').join(' ')
    : '이 공간에는 아무도 없었다.';
  const elapsedQuote = '잠시 뒤, 3분이 흘렀다.';
  const noteQuote = '탁자 위에는 회의 메모와 식지 않은 차가 놓여 있었다.';
  const story = [
    locationQuote + (lead ? ' ' + lead + '의 시선이 잠시 이쪽에 머물렀다.' : ''),
    line,
    personLine,
    presenceQuote,
    noteQuote,
    elapsedQuote,
    '[선택지]',
    '1. ' + (command.kind === 'OPENING' ? '플레이어만 볼 수 있는 ‘' + appName + '’ 앱을 열어 내용을 확인한다.' : names.length ? names[0] + '에게 방금 행동에 대한 생각을 묻는다.' : '이 장면에서 확인되지 않은 인물이 있는지 둘러본다.'),
    '2. ' + (lead ? lead + '에게 다가가 먼저 말을 건넨다.' : '가장 가까운 출입구 쪽을 살펴본다.'),
    '3. 현재 장소에 남아 주변에서 일어나는 일을 지켜본다.',
    '4. 장면을 떠나고 싶은 곳을 직접 정해 움직인다.'
  ].join('\n\n');
  const evidence = names.map(name => ({
    actor_id: present.find(id => byId.get(id)?.name === name),
    quote: '현장에는 ' + name + '이 남아 있다.'
  }));
  return {
    text: story,
    observer: {
      elapsed_minutes: 3,
      elapsed_evidence: elapsedQuote,
      scene: {
        location_id: context.scene.location_id,
        location_evidence: locationQuote,
        present_actor_ids: present,
        presence_evidence: evidence,
        empty_presence_evidence: names.length ? '' : presenceQuote,
        scene_note_status: 'observed',
        scene_note: '탁자 위에 회의 메모와 차가 놓여 있다.',
        scene_note_evidence: noteQuote
      },
      turn_digest: {
        summary: command.kind === 'OPENING' ? '상식개변: 회사편의 원작 인물이 등장하고 플레이어만 아는 상식개변 앱이 나타났다.' : notice ? '사내 메신저에 점심 메뉴 공지가 올라왔다.' : '현재 장면에서 플레이어의 직접 입력에 따라 서사가 이어졌다.',
        important: /약속|갈등|도움|거절/.test(command.literal_action ?? '')
      },
      actor_ids: present,
      keywords: command.literal_action ? command.literal_action.split(/\s+/).filter(Boolean).slice(0, 6) : ['상식개변', lead].filter(Boolean),
      mind_monitor: {},
      player_inner_thought: '',
      media_hint: { kind: notice ? 'company_notice' : 'none' }
    }
  };
}

export function createScriptedProvider() {
  return {
    mode: 'scripted-preview',
    modelNames: { story: 'scripted-preview', observer: 'scripted-preview' },
    async story({ context, command, onChunk = null }) {
      const output = scriptedStory({ context, command }).text;
      for (let offset = 0; offset < output.length; offset += 28) onChunk?.(output.slice(offset, offset + 28));
      return output;
    },
    async observe({ context, command }) {
      return JSON.stringify(scriptedStory({ context, command }).observer);
    }
  };
}

export function providerAvailability(env = process.env) {
  const settings = configuration(env);
  return settings.ready
    ? { mode: 'company-configured', ready: true, models: { story: settings.storyModel, observer: settings.observerModel } }
    : { mode: 'company-unconfigured', ready: false, reason: 'existing_company_llm_environment_unavailable', models: null };
}
