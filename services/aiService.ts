import { FamilyCues, Part, Section, Series, Service, Supply } from '../types';
import { newPart, newSection, newSeries, newService, newSupply } from '../lib/factory';
import { PART_TYPE_KEYS, PART_TYPES } from '../lib/partTypes';
import { AISettings } from './aiSettings';

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

const post = async (settings: AISettings, body: object): Promise<Response> => {
  try {
    return await fetch(endpoint(settings, '/chat/completions'), { method: 'POST', headers: headers(settings), body: JSON.stringify(body) });
  } catch {
    throw new Error(`Could not reach your AI server at ${settings.baseUrl}. Make sure it is running and allows requests from this site (CORS).`);
  }
};

const chat = async (settings: AISettings, messages: ChatMessage[], json: boolean): Promise<string> => {
  const body = { model: settings.model, messages, temperature: 0.7, stream: false };

  // Ask for JSON mode first; some servers reject response_format, so retry without it.
  let response = await post(settings, json ? { ...body, response_format: { type: 'json_object' } } : body);
  if (json && (response.status === 400 || response.status === 422)) {
    response = await post(settings, body);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`AI server returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }
  const data = await response.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from the AI server.');
  // Reasoning models (e.g. Qwen 3, DeepSeek-R1) may include their thinking; keep only the answer.
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

// Local models sometimes wrap JSON in prose or code fences; pull out the outermost object.
const chatJson = async <T>(settings: AISettings, prompt: string): Promise<T> => {
  const text = await chat(settings, [
    { role: 'system', content: `${SYSTEM} You always respond with a single valid JSON object and nothing else.` },
    { role: 'user', content: prompt },
  ], true);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('The AI response did not contain JSON.');
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new Error('The AI returned malformed JSON. Try again, or use a larger model.');
  }
};

const chatText = (settings: AISettings, prompt: string) =>
  chat(settings, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], false);

export const testConnection = async (settings: AISettings): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(endpoint(settings, '/models'), { headers: headers(settings) });
  } catch {
    throw new Error(`Could not reach ${settings.baseUrl}. Is the server running, and is CORS enabled?`);
  }
  if (!response.ok) throw new Error(`Server responded with ${response.status}.`);
  const data = await response.json().catch(() => null);
  const models: string[] = Array.isArray(data?.data) ? data.data.map((m: { id: string }) => m.id) : [];
  if (models.length && !models.includes(settings.model)) {
    return `Connected, but model "${settings.model}" wasn't listed. Available: ${models.slice(0, 8).join(', ')}`;
  }
  return 'Connected.';
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

export const draftPartText = (settings: AISettings, service: Service, section: Section, part: Part, field: TextField, instruction: string) =>
  chatText(settings, [
    describeService(service, part.id),
    '',
    `You are writing the "${part.title}" part (${PART_TYPES[part.type].label}, ${part.minutes} minutes) in the "${section.title}" section.`,
    part.script && field !== 'script' ? `Its current script is:\n${part.script}` : '',
    part[field] ? `The current text is:\n${part[field]}\n\nRevise or improve it.` : '',
    FIELD_ASK[field],
    instruction && `Additional direction from the leader: ${instruction}`,
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

export const suggestParts = async (settings: AISettings, service: Service, section: Section, instruction: string): Promise<Part[]> => {
  const result = await chatJson<{ parts?: unknown[] }>(settings, [
    describeService(service),
    '',
    `Suggest 1–3 new parts for the "${section.title}" section that fit the big idea and complement what is already there.`,
    instruction && `Direction from the leader: ${instruction}`,
    `Respond as {"parts":[${PART_SHAPE}]}. Write full scripts and instructions, not outlines.`,
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
    'Write full scripts and instructions a volunteer can use directly.',
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
  keyVerse?: string;
  hook?: string;
  teaching?: string;
  discussionQuestions?: string[];
  challenge?: string;
  icebreaker?: string;
  prayerFocus?: string;
  objectives?: string[];
  family?: Partial<FamilyCues>;
  activity?: { title?: string; instructions?: string; supplies?: unknown[] };
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
      'Write the full lesson content.',
      'Respond as {"keyVerse":"verse text (reference)","hook":"100-150 word opening story or illustration, as a script","teaching":"3 teaching points, each a headline followed by a 100-150 word script paragraph","discussionQuestions":["5 questions moving from observation to interpretation to application"],"challenge":"a specific practice for the week","objectives":["3-4 learning objectives, each starting with a verb"],"icebreaker":"one fun small group opening question tied to the theme","prayerFocus":"one sentence on what the small group should pray for","family":{"morning":"a verse or truth a parent can say to start the day","onTheGo":"something to talk about or do in the car","meal":"a question to ask at dinner","bedtime":"a short prayer to pray over their child"},"activity":{"title":"...","instructions":"numbered steps","supplies":[{"name":"...","qty":1,"per":"total|person|group"}]}}',
    ].join('\n'));
    const questions = (d.discussionQuestions ?? []).map((q, n) => `${n + 1}. ${q}`).join('\n');
    services.push(newService({
      title: week.title || `Week ${i + 1}`,
      seriesId: series.id,
      week: i + 1,
      audience: params.audience,
      bigIdea: week.bigIdea,
      scripture: week.scripture,
      keyVerse: d.keyVerse,
      objectives: (d.objectives ?? []).join('\n'),
      family: d.family,
      sections: [
        newSection({ title: 'Opening', parts: [newPart({ title: 'Welcome & Hook', type: 'script', minutes: 10, script: d.hook })] }),
        newSection({ title: 'Worship', parts: [newPart({ title: 'Worship Set', type: 'worship', minutes: 15 })] }),
        newSection({
          title: 'Teaching',
          parts: [
            newPart({ title: week.title || 'Teaching', type: 'bible-story', minutes: 20, script: d.teaching }),
            newPart({ title: 'Key Verse', type: 'bible-verse', minutes: 3, script: d.keyVerse }),
          ],
        }),
        newSection({
          title: 'Small Groups',
          parts: [
            newPart({ title: 'Icebreaker', type: 'discussion', minutes: 5, script: d.icebreaker }),
            newPart({ title: d.activity?.title || 'Activity', type: 'group-activity', minutes: 15, instructions: d.activity?.instructions, supplies: d.activity?.supplies }),
            newPart({ title: 'Discussion', type: 'discussion', minutes: 15, script: questions }),
            newPart({ title: 'Prayer Focus', type: 'prayer', minutes: 5, script: d.prayerFocus }),
            newPart({ title: 'Weekly Challenge', type: 'script', minutes: 5, script: d.challenge }),
          ],
        }),
      ],
    }));
  }
  return { series, weeks: services };
};
