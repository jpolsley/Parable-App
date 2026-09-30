import { FamilyCues, Part, Section, Series, Service, Supply } from '../types';
import { newPart, newSection, newSeries, newService, newSupply } from '../lib/factory';
import { PART_TYPE_KEYS, PART_TYPES } from '../lib/partTypes';
import { AISettings, serverKind, serverOrigin } from './aiSettings';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const SYSTEM = "You are an experienced children's and youth ministry curriculum writer. You prioritize literary context, historical background, and Jesus-centered theology, and you write engaging, age-appropriate content that a volunteer leader can read and use directly. Avoid Christian jargon where possible; use fresh language.";

const endpoint = (settings: AISettings, path: string) => `${settings.baseUrl.replace(/\/+$/, '')}${path}`;

const headers = (settings: AISettings) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey) h['Authorization'] = `Bearer ${settings.apiKey}`;
  return h;
};

const unreachable = (settings: AISettings) => {
  const kind = serverKind(settings);
  return new Error(
    kind === 'steward' ? `Could not reach Steward at ${settings.baseUrl}. Is the Steward app running on this laptop?`
    : kind === 'ollama' ? `Could not reach Ollama at ${settings.baseUrl}. Make sure it is running, and that it allows this site (OLLAMA_ORIGINS), or connect through Steward instead.`
    : `Could not reach your AI server at ${settings.baseUrl}. Make sure it is running and allows requests from this site (CORS).`,
  );
};

const send = async (settings: AISettings, url: string, body: object): Promise<Response> => {
  try {
    return await fetch(url, { method: 'POST', headers: headers(settings), body: JSON.stringify(body) });
  } catch {
    throw unreachable(settings);
  }
};

const failed = async (response: Response) => {
  const detail = await response.text().catch(() => '');
  if (response.status === 401 || response.status === 403) return new Error('The AI server refused the request. Check the key in AI settings.');
  return new Error(`AI server returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
};

// Qwen 3 thinks out loud unless told not to; the /no_think switch goes at the end of the last user message.
const noThink = (settings: AISettings, messages: ChatMessage[]): ChatMessage[] => {
  if (!/qwen3/i.test(settings.model)) return messages;
  const last = messages.length - 1;
  return messages.map((m, i) => (i === last && m.role === 'user' ? { ...m, content: `${m.content} /no_think` } : m));
};

const chat = async (settings: AISettings, messages: ChatMessage[], json: boolean): Promise<string> => {
  const kind = serverKind(settings);
  // Structured output is steadier from a small model with no sampling randomness.
  const temperature = json ? 0 : 0.7;
  let text: string | undefined;

  if (kind === 'ollama') {
    // Ollama's own endpoint can switch thinking off properly, keep the model loaded, and widen the context.
    const url = `${serverOrigin(settings)}/api/chat`;
    const body = {
      model: settings.model,
      messages,
      stream: false,
      think: false,
      keep_alive: '24h',
      options: { num_ctx: 12288, temperature },
      ...(json ? { format: 'json' } : {}),
    };
    let response = await send(settings, url, body);
    // Older Ollama versions don't know "think"; fall back to the prompt switch.
    if (response.status === 400) response = await send(settings, url, { ...body, think: undefined, messages: noThink(settings, messages) });
    if (!response.ok) throw await failed(response);
    text = (await response.json())?.message?.content;
  } else {
    const url = endpoint(settings, '/chat/completions');
    const body = {
      model: settings.model,
      messages: kind === 'steward' ? messages : noThink(settings, messages),
      temperature,
      stream: false,
      ...(kind === 'steward' ? { use_docs: settings.useDocs } : {}),
    };
    // Ask for JSON mode first; some servers reject response_format, so retry without it.
    let response = await send(settings, url, json ? { ...body, response_format: { type: 'json_object' } } : body);
    if (json && (response.status === 400 || response.status === 422)) response = await send(settings, url, body);
    if (!response.ok) throw await failed(response);
    text = (await response.json())?.choices?.[0]?.message?.content;
  }

  if (!text) throw new Error('No response from the AI server.');
  // Reasoning models (e.g. Qwen 3, DeepSeek-R1) may include their thinking; keep only the answer.
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
};

// Small local models wrap JSON in prose or code fences and leave trailing commas; be forgiving.
export const parseJsonLoose = <T>(text: string): T => {
  const tryParse = (from: string, to: string) => {
    const start = text.indexOf(from);
    const end = text.lastIndexOf(to);
    if (start === -1 || end <= start) return undefined;
    const raw = text.slice(start, end + 1);
    for (const candidate of [raw, raw.replace(/,\s*([}\]])/g, '$1')]) {
      try {
        return JSON.parse(candidate) as unknown;
      } catch {
        // try the next cleanup
      }
    }
    return undefined;
  };
  // Whichever comes first is the outer value: a list of objects starts with "[", not its first "{".
  const obj = text.indexOf('{');
  const arr = text.indexOf('[');
  const listFirst = arr !== -1 && (obj === -1 || arr < obj);
  const found = listFirst ? tryParse('[', ']') ?? tryParse('{', '}') : tryParse('{', '}') ?? tryParse('[', ']');
  if (found === undefined) throw new Error('The AI returned something that wasn\'t valid JSON. Try again.');
  // A bare list where an object was expected: hand it back under a generic key.
  return (Array.isArray(found) ? { items: found } : found) as T;
};

// Structured requests are their own focused call that asks for only the JSON.
const chatJson = async <T>(settings: AISettings, prompt: string): Promise<T> =>
  parseJsonLoose<T>(await chat(settings, [
    { role: 'system', content: `${SYSTEM} You always respond with a single valid JSON object and nothing else.` },
    { role: 'user', content: prompt },
  ], true));

const chatText = (settings: AISettings, prompt: string) =>
  chat(settings, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], false);

export const testConnection = async (settings: AISettings): Promise<string> => {
  const kind = serverKind(settings);
  const get = async (url: string) => {
    let response: Response;
    try {
      response = await fetch(url, { headers: headers(settings) });
    } catch {
      throw unreachable(settings);
    }
    if (response.status === 401 || response.status === 403) throw new Error('Connected, but the key was refused. Check the key.');
    if (!response.ok) throw new Error(`Server responded with ${response.status}.`);
    return response.json().catch(() => null);
  };
  const check = (models: string[], extra = '') => {
    if (models.length && !models.some((m) => m === settings.model || m.startsWith(`${settings.model}:`))) {
      return `Connected${extra}, but model "${settings.model}" wasn't listed. Available: ${models.slice(0, 8).join(', ')}`;
    }
    return `Connected${extra}.`;
  };

  if (kind === 'steward') {
    const data = await get(`${serverOrigin(settings)}/health`);
    const models: string[] = Array.isArray(data?.models) ? data.models.map((m: unknown) => (typeof m === 'string' ? m : (m as { name?: string })?.name ?? '')).filter(Boolean) : [];
    const docs = typeof data?.docs === 'number' ? data.docs : typeof data?.documents === 'number' ? data.documents : undefined;
    return check(models, ` to Steward${docs !== undefined ? ` (${docs} documents loaded)` : ''}`);
  }
  if (kind === 'ollama') {
    const data = await get(`${serverOrigin(settings)}/api/tags`);
    return check(Array.isArray(data?.models) ? data.models.map((m: { name: string }) => m.name) : [], ' to Ollama');
  }
  const data = await get(endpoint(settings, '/models'));
  return check(Array.isArray(data?.data) ? data.data.map((m: { id: string }) => m.id) : []);
};

// ---------- Context ----------

// A service plus the series it belongs to, so AI drafts fit the series theme.
export type ServiceWithSeries = Service & { seriesInfo?: Series };

export const describeService = (service: ServiceWithSeries, focusPartId?: string) => {
  const series = service.seriesInfo;
  const lines = [
    `Service: "${service.title}" for ${service.audience}.`,
    series && `Series: "${series.title}"${service.week ? `, week ${service.week}` : ''}.${series.description ? ` ${series.description}` : ''}`,
    series?.bigIdea && `Series theme: ${series.bigIdea}`,
    series?.memoryVerse && `Series memory verse: ${series.memoryVerse}`,
    service.bigIdea && `Big idea: ${service.bigIdea}`,
    service.scripture && `Scripture: ${service.scripture}`,
    service.keyVerse && `Key verse: ${service.keyVerse}`,
    `Class size: about ${service.classSize} kids in ${service.groupCount} groups.`,
    'Run of service:',
    ...service.sections.flatMap((s) => [
      `- ${s.title}`,
      ...s.parts.map((p) => `    - ${p.title} (${PART_TYPES[p.type].label}, ${p.minutes} min)${p.id === focusPartId ? '  <-- the part being written' : ''}`),
    ]),
  ];
  return lines.filter(Boolean).join('\n');
};

// ---------- Part-level helpers ----------

export type TextField = 'script' | 'instructions' | 'inclusionTips' | 'leaderNotes';

const FIELD_ASK: Record<TextField, string> = {
  script: 'Write the word-for-word script the leader reads aloud for this part. Use short paragraphs. Mark any leader actions in [brackets].',
  instructions: 'Write clear step-by-step leader instructions for this part: setup, how to lead it, and how to wrap up. Use a numbered list.',
  inclusionTips: 'Write 3–5 practical tips for adapting this part so kids with different abilities, attention spans, sensory needs, or language levels can fully participate.',
  leaderNotes: 'Write brief prep notes for the leader: what to review beforehand, what to watch for, and how this part connects to the big idea.',
};

// How text should be shaped so it prints well (the lesson layout reads these conventions).
const FORMAT_RULES = [
  'Formatting rules:',
  '- Separate paragraphs with a blank line.',
  '- Inside a script, directions for the leader go in square brackets, e.g. [Hold up the phone.] or [Pause for answers.]',
  '- For a list, put each item on its own line starting with "• ".',
  '- A labeled step keeps its label and colon, e.g. "The setup: Pair students up."',
].join('\n');

export const draftPartText = (settings: AISettings, service: Service, section: Section, part: Part, field: TextField, instruction: string) =>
  chatText(settings, [
    describeService(service, part.id),
    '',
    `You are writing the "${part.title}" part (${PART_TYPES[part.type].label}, ${part.minutes} minutes) in the "${section.title}" section.`,
    part.script && field !== 'script' ? `Its current script is:\n${part.script}` : '',
    part[field] ? `The current text is:\n${part[field]}\n\nRevise or improve it.` : '',
    FIELD_ASK[field],
    instruction && `Additional direction from the leader: ${instruction}`,
    field === 'script' || field === 'instructions' ? FORMAT_RULES : '',
    'Return only the text itself, with no preamble or headings.',
  ].filter(Boolean).join('\n'));

export const suggestSupplies = async (settings: AISettings, service: Service, part: Part): Promise<Supply[]> => {
  const result = await chatJson<{ supplies?: unknown[] }>(settings, [
    describeService(service, part.id),
    '',
    `List the supplies needed for "${part.title}" (${PART_TYPES[part.type].label}).`,
    part.instructions && `Instructions:\n${part.instructions}`,
    part.script && `Script:\n${part.script}`,
    'Respond as {"supplies":[{"name":"...","qty":1,"per":"total"}]}. "per" is "total" (fixed amount), "person" (each kid needs qty), or "group" (each small group needs qty).',
  ].filter(Boolean).join('\n'));
  return (result.supplies ?? []).map((s) => newSupply((s ?? {}) as Partial<Supply>)).filter((s) => s.name);
};

// ---------- Section / service helpers ----------

const PART_SHAPE = `{"title":"...","type":"one of: ${PART_TYPE_KEYS.join(', ')}","minutes":5,"script":"word-for-word leader script","instructions":"numbered steps","supplies":[{"name":"...","qty":1,"per":"total|person|group"}]}`;

// Naming conventions the printed lesson recognizes (numbered points, readings, challenges).
const PART_RULES = [
  'Part conventions:',
  '- A teaching point is its own part titled "Point 1: <headline>" (type "script").',
  '- A scripture reading is titled "Read: <reference>" (type "bible-verse"). Do not quote long passages from memory; put "Read <reference> aloud." in instructions instead.',
  '- Discussion questions: type "discussion", script is numbered lines "1. …".',
  '- A take-home action is titled "Weekly Challenge: <name>".',
  '- script is only what the leader says out loud; instructions are directions for the leader.',
  FORMAT_RULES,
].join('\n');

export const suggestParts = async (settings: AISettings, service: Service, section: Section, instruction: string): Promise<Part[]> => {
  const result = await chatJson<{ parts?: unknown[] }>(settings, [
    describeService(service),
    '',
    `Suggest 1–3 new parts for the "${section.title}" section that fit the big idea and complement what is already there.`,
    instruction && `Direction from the leader: ${instruction}`,
    `Respond as {"parts":[${PART_SHAPE}]}. Write full scripts and instructions, not outlines.`,
    PART_RULES,
  ].filter(Boolean).join('\n'));
  return (result.parts ?? []).map((p) => newPart((p ?? {}) as Partial<Part>));
};

export const draftService = async (
  settings: AISettings,
  params: { topic: string; audience: string; skeleton: Section[]; series?: Series },
): Promise<Pick<Service, 'title' | 'bigIdea' | 'keyVerse' | 'scripture' | 'sections'>> => {
  const skeleton = params.skeleton.length
    ? `Use exactly this structure, filling in every part:\n${params.skeleton.map((s) => `- ${s.title}: ${s.parts.map((p) => `${p.title} (${p.type}, ${p.minutes} min)`).join('; ')}`).join('\n')}`
    : 'Design 3–5 sections with 1–4 parts each, totaling about 75–90 minutes.';
  const result = await chatJson<Record<string, unknown>>(settings, [
    `Create a complete ministry service about "${params.topic}" for ${params.audience}.`,
    params.series && `It is one week of the series "${params.series.title}".${params.series.bigIdea ? ` Series theme: ${params.series.bigIdea}` : ''}`,
    skeleton,
    `Respond as {"title":"...","bigIdea":"one sentence","scripture":"reference","keyVerse":"verse text (reference)","sections":[{"title":"...","parts":[${PART_SHAPE}]}]}.`,
    'Write full scripts and instructions a volunteer can use directly. The section for small group leaders should have "Small Group" in its title.',
    PART_RULES,
  ].filter(Boolean).join('\n'));
  const service = newService({ ...result, sections: Array.isArray(result.sections) ? result.sections : [] });
  return { title: service.title, bigIdea: service.bigIdea, keyVerse: service.keyVerse, scripture: service.scripture, sections: service.sections };
};

const FAMILY_ASK: Record<keyof FamilyCues, string> = {
  morning: 'a short "wake-up" moment: a verse or truth a parent can say to their child to start the day',
  onTheGo: 'an "on the go" moment: something to talk about, notice, or do together in the car or out and about',
  meal: 'an "around the table" moment: one or two questions a parent can ask at a meal',
  bedtime: 'a "lights out" moment: a short prayer or blessing a parent can pray over their child',
};

export const draftFamilyCue = (settings: AISettings, service: ServiceWithSeries, key: keyof FamilyCues, instruction: string) =>
  chatText(settings, [
    describeService(service),
    '',
    `Write ${FAMILY_ASK[key]} that reinforces this week's lesson for parents of ${service.audience}.`,
    service.family[key] && `The current text is:\n${service.family[key]}\n\nRevise or improve it.`,
    instruction && `Additional direction: ${instruction}`,
    'Write it to the parent, in 1–3 sentences. Return only the text.',
  ].filter(Boolean).join('\n'));

export const draftObjectives = (settings: AISettings, service: ServiceWithSeries, instruction: string) =>
  chatText(settings, [
    describeService(service),
    '',
    `Write 3–5 learning objectives for this session, each starting with a verb and describing what ${service.audience} will know or do by the end.`,
    service.objectives && `The current objectives are:\n${service.objectives}\n\nRevise or improve them.`,
    instruction && `Additional direction: ${instruction}`,
    'Return one objective per line, with no numbering or bullets.',
  ].filter(Boolean).join('\n'));

export const askAboutService = (settings: AISettings, service: Service, question: string) =>
  chatText(settings, `${describeService(service)}\n\nThe leader asks: ${question}\n\nAnswer helpfully and concisely.`);

// ---------- Series ----------

interface WeekOutline {
  title?: string;
  scripture?: string;
  bigIdea?: string;
}

interface WeekDetail {
  objectives?: string[];
  welcome?: string;
  illustration?: { title?: string; script?: string; supplies?: unknown[] };
  transition?: string;
  background?: string;
  teachingPoints?: { point?: string; script?: string }[];
  teaching?: string;
  challenge?: { title?: string; script?: string } | string;
  icebreaker?: string;
  discussionQuestions?: string[];
  prayerFocus?: string;
  family?: Partial<FamilyCues>;
}

export const draftSeries = async (
  settings: AISettings,
  params: { topic: string; audience: string; weeks: number; startDate: string; title?: string; color?: Series['color'] },
  onProgress: (message: string) => void,
): Promise<{ series: Series; weeks: Service[] }> => {
  onProgress('Outlining the series…');
  const outline = await chatJson<{ title?: string; description?: string; bigIdea?: string; memoryVerse?: string; leaderGuide?: string; weeks?: WeekOutline[] }>(settings, [
    `Outline a ${params.weeks}-week ministry series about "${params.topic}" for ${params.audience}.`,
    'Fit the topic into the larger story of the Bible.',
    `Respond as {"title":"series title","description":"2-sentence series overview","bigIdea":"the one idea that ties the series together","memoryVerse":"verse text (reference)","leaderGuide":"a warm 120-word welcome letter to volunteer leaders explaining the series goal and how to lead it","weeks":[{"title":"...","scripture":"reference","bigIdea":"one sentence"}]} with exactly ${params.weeks} weeks.`,
  ].join('\n'));
  const series = newSeries({
    title: params.title || outline.title || params.topic,
    description: outline.description,
    bigIdea: outline.bigIdea,
    memoryVerse: outline.memoryVerse,
    leaderGuide: outline.leaderGuide,
    audience: params.audience,
    startDate: params.startDate,
    color: params.color,
  });
  const seriesTitle = series.title;
  const weeks = (outline.weeks ?? []).slice(0, params.weeks);
  if (!weeks.length) throw new Error('The AI did not return any weeks.');

  const services: Service[] = [];
  for (const [i, week] of weeks.entries()) {
    onProgress(`Writing week ${i + 1} of ${weeks.length}: ${week.title ?? ''}`);
    const d = await chatJson<WeekDetail>(settings, [
      `Series: "${seriesTitle}" for ${params.audience}. Week ${i + 1}: "${week.title}". Scripture: ${week.scripture}. Big idea: ${week.bigIdea}.`,
      'Write the full lesson a volunteer leader can read and use directly.',
      'Respond as {"objectives":["3 short objectives, each starting with a verb"],"welcome":"2-3 sentence welcome that introduces today\'s topic","illustration":{"title":"short name","script":"120-180 word opening story, object lesson, or game setup the leader says, with [directions] in brackets","supplies":[{"name":"...","qty":1,"per":"total|person|group"}]},"transition":"1-2 sentences that bridge from the illustration to the scripture","background":"2-4 sentences of historical or literary context for the passage","teachingPoints":[{"point":"short headline","script":"100-150 words the leader says"}] (exactly 3),"challenge":{"title":"short name","script":"a specific practice for this week, 2-4 sentences"},"icebreaker":"one fun small group opening question tied to the theme","discussionQuestions":["5 questions moving from observation to interpretation to application"],"prayerFocus":"one sentence on what the small group should pray for","family":{"morning":"a truth a parent can say to start the day","onTheGo":"something to talk about or do in the car","meal":"a question to ask at dinner","bedtime":"a short prayer to pray together"}}',
      FORMAT_RULES,
    ].join('\n'));
    const questions = (d.discussionQuestions ?? []).map((q, n) => `${n + 1}. ${q}`).join('\n');
    const challenge = typeof d.challenge === 'string' ? { title: '', script: d.challenge } : d.challenge ?? {};
    const points = d.teachingPoints?.length
      ? d.teachingPoints.map((t, n) => newPart({ title: `Point ${n + 1}: ${t.point ?? ''}`, type: 'script', minutes: 6, script: t.script }))
      : [newPart({ title: week.title || 'Teaching', type: 'script', minutes: 18, script: d.teaching })];
    services.push(newService({
      title: week.title || `Week ${i + 1}`,
      seriesId: series.id,
      week: i + 1,
      audience: params.audience,
      bigIdea: week.bigIdea,
      scripture: week.scripture,
      objectives: (d.objectives ?? []).join('\n'),
      family: d.family,
      sections: [
        newSection({
          title: 'Opening',
          parts: [
            newPart({ title: 'Welcome', type: 'script', minutes: 3, script: d.welcome }),
            newPart({ title: `Illustration: ${d.illustration?.title || 'Opening Story'}`, type: 'script', minutes: 8, script: d.illustration?.script, supplies: d.illustration?.supplies }),
            newPart({ title: 'Transition', type: 'script', minutes: 2, script: d.transition }),
          ],
        }),
        newSection({
          title: 'Scripture',
          parts: [
            newPart({ title: `Read: ${week.scripture || 'Scripture'}`, type: 'bible-verse', minutes: 4, instructions: `Read ${week.scripture || "this week's passage"} aloud from your Bible.` }),
            newPart({ title: 'Background', type: 'script', minutes: 3, script: d.background }),
          ],
        }),
        newSection({ title: 'Teaching', parts: points }),
        newSection({
          title: 'Application',
          parts: [newPart({ title: `Weekly Challenge: ${challenge.title || 'This Week'}`, type: 'script', minutes: 4, script: challenge.script })],
        }),
        newSection({
          title: 'Small Groups',
          parts: [
            newPart({ title: 'Icebreaker', type: 'discussion', minutes: 5, script: d.icebreaker }),
            newPart({ title: 'Discussion', type: 'discussion', minutes: 15, script: questions }),
            newPart({ title: 'Prayer Focus', type: 'prayer', minutes: 5, script: d.prayerFocus }),
          ],
        }),
      ],
    }));
  }
  return { series, weeks: services };
};
