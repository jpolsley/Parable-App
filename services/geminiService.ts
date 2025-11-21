
import { GoogleGenAI, Type } from "@google/genai";
import { CurriculumSeries, GeneratorParams } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-ci' });

export const generateCurriculum = async (params: GeneratorParams): Promise<CurriculumSeries> => {
  const { topic, audience, duration, tone } = params;

  const prompt = `
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
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class curriculum developer for The Bible Project. You prioritize literary context, historical background, and Jesus-centered theology. You write full content that a leader could read and teach from directly, not just bullet points.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Series Title" },
            description: { type: Type.STRING, description: "Series Overview (approx 50 words)" },
            target_audience: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week_number: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  scripture_reference: { type: Type.STRING },
                  key_verse: { type: Type.STRING },
                  main_idea: { type: Type.STRING },
                  learning_objective: { type: Type.STRING },
                  hook: { type: Type.STRING, description: "Full opening story/hook text" },
                  teaching_points: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        point: { type: Type.STRING, description: "The headline" },
                        description: { type: Type.STRING, description: "Full teaching paragraph (100+ words)" }
                      },
                      required: ["point", "description"]
                    }
                  },
                  discussion_questions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  application_challenge: { type: Type.STRING },
                  activity_idea: { type: Type.STRING }
                },
                required: ["week_number", "title", "scripture_reference", "key_verse", "main_idea", "learning_objective", "hook", "teaching_points", "discussion_questions", "application_challenge", "activity_idea"]
              }
            }
          },
          required: ["title", "description", "weeks", "target_audience"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as CurriculumSeries;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
