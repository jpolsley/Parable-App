import { CurriculumSeries, GeneratorParams } from "../types";
import { AISettings } from "./aiSettings";

const SYSTEM_INSTRUCTION = "You are a world-class curriculum developer for The Bible Project. You prioritize literary context, historical background, and Jesus-centered theology. You write full content that a leader could read and teach from directly, not just bullet points. You always respond with a single valid JSON object and nothing else.";

const JSON_SHAPE = `{
  "title": "Series Title",
  "description": "Series overview (approx 50 words)",
  "target_audience": "string",
  "weeks": [
    {
      "week_number": 1,
      "title": "string",
      "scripture_reference": "string",
      "key_verse": "string",
      "main_idea": "string",
      "learning_objective": "string",
      "hook": "Full opening story/hook text",
      "teaching_points": [
        { "point": "The headline", "description": "Full teaching paragraph (100+ words)" }
      ],
      "discussion_questions": ["string"],
      "application_challenge": "string",
      "activity_idea": "string"
    }
  ]
}`;

const buildPrompt = ({ topic, audience, duration, tone }: GeneratorParams) => `
    Create a comprehensive, print-ready ${duration}-week youth ministry curriculum series about "${topic}".
    Target Audience: ${audience}.
    Tone: ${tone}.
    
    For each week, provide a FULL lesson plan (not just an outline) including:
    1. Creative Title & Scripture Reference.
    2. Key Verse (NIV or ESV).
    3. Learning Objective (Clear outcome).
    4. Main Idea (The 'Big Idea' in one sentence).
    5. The Hook: A full, engaging opening story, cultural analogy, or interaction (approx 100-150 words) that sets up the tension.
    6. Teaching Guide: 3 distinct teaching points. For EACH point, provide a detailed paragraph (approx 100-150 words) of teaching script/commentary. It should be theologically rich, explaining the text and connecting to the gospel.
    7. Discussion Questions: 5 thought-provoking questions (Observation -> Interpretation -> Application).
    8. Application Challenge: A specific weekly practice.
    9. Activity: A game or object lesson that visibly demonstrates the truth.

    Style Guide:
    - Intellectual and respectful of the student's capacity.
    - Narrative-driven (fit this topic into the larger story of the Bible).
    - Avoid Christian jargon where possible; use fresh language.
    - Formatting must be clean and structured.

    Respond ONLY with a JSON object in exactly this shape, with exactly ${duration} entries in "weeks":
    ${JSON_SHAPE}
  `;

// Local models sometimes wrap JSON in prose or code fences; pull out the outermost object.
const extractJson = (text: string): string => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error("The AI response did not contain JSON.");
  }
  return text.slice(start, end + 1);
};

const chatCompletion = async (settings: AISettings, body: object): Promise<Response> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey) headers['Authorization'] = `Bearer ${settings.apiKey}`;

  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  try {
    return await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new Error(`Could not reach your AI server at ${settings.baseUrl}. Make sure it is running and allows requests from this site (CORS).`);
  }
};

export const generateCurriculum = async (params: GeneratorParams, settings: AISettings): Promise<CurriculumSeries> => {
  const body = {
    model: settings.model,
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: buildPrompt(params) },
    ],
    temperature: 0.7,
    stream: false,
  };

  // Ask for JSON mode first; some servers reject response_format, so retry without it.
  let response = await chatCompletion(settings, { ...body, response_format: { type: 'json_object' } });
  if (response.status === 400 || response.status === 422) {
    response = await chatCompletion(settings, body);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`AI server returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const data = await response.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No response from the AI server.");
  }

  const parsed = JSON.parse(extractJson(text)) as CurriculumSeries;
  if (!Array.isArray(parsed.weeks)) {
    throw new Error("The AI response was missing the weekly lessons.");
  }
  return parsed;
};
