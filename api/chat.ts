import { GoogleGenAI } from "@google/genai";

function createClient(apiKey?: string) {
  return new GoogleGenAI({
    apiKey: apiKey || process.env.GEMINI_API_KEY,
    apiVersion: "v1beta",
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const {
      message,
      systemInstruction,
      history,
      apiKey,
      tools,
      model,
      location,
    } = req.body || {};

    const client = createClient(apiKey);
    const apiTools: any[] = [];

    if (tools) {
      if (tools.googleSearch) apiTools.push({ type: "google_search" });
      if (tools.urlContext) apiTools.push({ type: "url_context" });
      if (tools.googleMaps) {
        const mapTool: any = { type: "google_maps" };
        if (location?.latitude && location?.longitude) {
          mapTool.latitude = location.latitude;
          mapTool.longitude = location.longitude;
        }
        apiTools.push(mapTool);
      }
    }

    let inputPrompt = message || "";
    if (history && Array.isArray(history) && history.length > 0) {
      const historyText = history
        .map((h: any) => {
          const textPart = h.parts?.map((p: any) => p.text).join("\n") || "";
          return `${h.role === "user" ? "User" : "Assistant"}: ${textPart}`;
        })
        .join("\n");
      inputPrompt = `${historyText}\nUser: ${message}`;
    }

    const payload: any = {
      model: model || "gemini-3.6-flash",
      input: inputPrompt,
    };

    if (systemInstruction) {
      payload.system_instruction = systemInstruction;
    }

    if (apiTools.length > 0) {
      payload.tools = apiTools;
    }

    const interaction: any = await (client as any).interactions.create(payload);

    let textOutput = interaction.output_text || "";
    const citations: any[] = [];
    const steps: any[] = [];

    if (interaction.steps && Array.isArray(interaction.steps)) {
      for (const step of interaction.steps) {
        if (step.type === "thought") {
          let thoughtText = "";
          if (Array.isArray(step.summary)) {
            thoughtText = step.summary
              .map((s: any) => s.text || "")
              .filter(Boolean)
              .join("\n");
          } else if (typeof step.summary === "string") {
            thoughtText = step.summary;
          } else if (step.text) {
            thoughtText = step.text;
          }
          if (thoughtText) {
            steps.push({ type: "thought", text: thoughtText });
          }
        } else if (step.type === "google_search_call" && step.arguments?.queries) {
          steps.push({ type: "google_search", queries: step.arguments.queries });
        } else if (step.type === "url_context_result") {
          steps.push({ type: "url_context", url: step.url || step.uri, status: step.status });
        } else if (step.type === "model_output" && Array.isArray(step.content)) {
          for (const block of step.content) {
            if (block.text && !textOutput) {
              textOutput = block.text;
            }
            if (block.annotations && Array.isArray(block.annotations)) {
              for (const ann of block.annotations) {
                if (ann.type === "url_citation" || ann.type === "place_citation") {
                  citations.push({
                    title: ann.title || ann.name || ann.url,
                    url: ann.url,
                    type: ann.type,
                    citedText:
                      block.text && ann.start_index !== undefined && ann.end_index !== undefined
                        ? block.text.substring(ann.start_index, ann.end_index)
                        : undefined,
                  });
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({ text: textOutput, citations, steps });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response from Gemini" });
  }
}
