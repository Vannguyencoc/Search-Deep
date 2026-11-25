
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-3-flash-preview';

interface GenerativePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export const extractKeyIdeasAndMethodology = async (filePart: GenerativePart, language: 'EN' | 'VN' = 'EN'): Promise<string | null> => {
  try {
    const targetLanguage = language === 'VN' ? 'Vietnamese' : 'English';
    const prompt = `
      Analyze this document (image or PDF) as an expert Information Designer and Systems Theorist.
      
      Your goal is to provide a comprehensive analysis AND a structured, hierarchical concept network map.
      
      OUTPUT ALL TEXT IN THE NARRATIVE ANALYSIS (PART 1) IN ${targetLanguage.toUpperCase()}.
      
      ### PART 1: Narrative Analysis (Markdown)
      1.  **Key Ideas:** Summarize the critical core concepts and objectives.
      2.  **Methodology:** Detailed breakdown of the workflow or architecture.
      3.  **Key Findings:** Specific results, outcomes, or findings.
      4.  **Limitations & Future Work:** Constraints or areas for research.
      5.  **Reference Categorization:** List significant citations, categorizing them by the "Big Concept" they support, and include a specific quoted idea/phrase for each.

      ### PART 2: The Concept Network Map (JSON)
      Transform the text into a hierarchical concept network map using these constraints:
      - **Nodes:** Identify 7-12 atomic nodes (1-3 words max).
      - **Root Concept:** Determine the "Root" concept that governs the others.
      - **Relationships:** Define a "Linking Phrase" (a verb or short prepositional phrase) for EVERY link.
      - **Cross-Links:** Connect distant branches to show synthesis.
      - **Clarity:** Ensure every (Node A -> Link -> Node B) forms a coherent sentence.

      Structure your response exactly like this:
      [Markdown Narrative Analysis in ${targetLanguage}]
      
      ## Concept Map Data
      \`\`\`json
      {
        "nodes": [
          { "id": "RootConcept", "group": 1, "isRoot": true },
          { "id": "ConceptA", "group": 3 },
          { "id": "Author (2023)", "group": 5 }
        ],
        "links": [
          { "source": "RootConcept", "target": "ConceptA", "label": "utilizes", "value": 1 },
          { "source": "ConceptA", "target": "Author (2023)", "label": "supported by", "value": 1 }
        ]
      }
      \`\`\`

      Groups for nodes:
      - 1: Root / Methodology
      - 2: Findings
      - 3: Key Ideas / Concepts
      - 4: Limitations
      - 5: References

      Use clean Markdown (headings, bold, bullet points) for Part 1.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }, filePart] },
    });
    
    return response.text ?? null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};
