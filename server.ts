import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3005;

  app.use(express.json());

  // API route for Models
  app.get("/api/models", async (req, res) => {
    try {
      const apiKey = req.query.apiKey as string;
      const client = apiKey ? new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      }) : ai;

      const response = await client.models.list();
      
      let items: any[] = [];
      if (response && (response as any).items) {
         items = (response as any).items;
      } else if (response && Array.isArray(response)) {
         items = response;
      } else if (Symbol.asyncIterator in Object(response)) {
         for await (const item of (response as any)) {
             items.push(item);
         }
      } else if (Symbol.iterator in Object(response)) {
         for (const item of (response as any)) {
             items.push(item);
         }
      }

      const availableModels = items
         .filter((m: any) => {
             const actions = m.supportedActions || [];
             return actions.includes("generateContent") || actions.includes("bidiGenerateContent") || actions.length === 0;
         })
         .map((m: any) => ({
             id: m.name.replace("models/", ""),
             name: m.displayName || m.name,
             description: m.description,
             version: m.version
         }));

      res.json(availableModels);
    } catch (error: any) {
      console.error("Models API Error:", error);
      res.status(500).json({ error: error.message || "Failed to list models" });
    }
  });

  // API route for Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, systemInstruction, history, apiKey, tools, model, location } = req.body;
      
      const client = apiKey ? new GoogleGenAI({ 
        apiKey,
        apiVersion: 'v1beta'
      }) : new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        apiVersion: 'v1beta'
      });

      let apiTools: any[] = [];
      if (tools) {
        if (tools.googleSearch) apiTools.push({ type: "google_search" });
        if (tools.urlContext) apiTools.push({ type: "url_context" });
        if (tools.googleMaps) {
          const mapTool: any = { type: "google_maps" };
          if (location && location.latitude && location.longitude) {
            mapTool.latitude = location.latitude;
            mapTool.longitude = location.longitude;
          }
          apiTools.push(mapTool);
        }
      }

      let inputPrompt = message;
      if (history && Array.isArray(history) && history.length > 0) {
        const historyText = history.map((h: any) => {
          const textPart = h.parts?.map((p: any) => p.text).join('\n') || '';
          return `${h.role === 'user' ? 'User' : 'Assistant'}: ${textPart}`;
        }).join('\n');
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
      let citations: any[] = [];
      let steps: any[] = [];

      if (interaction.steps && Array.isArray(interaction.steps)) {
        for (const step of interaction.steps) {
          if (step.type === "thought") {
            let thoughtText = "";
            if (Array.isArray(step.summary)) {
              thoughtText = step.summary.map((s: any) => s.text || "").filter(Boolean).join("\n");
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
                      citedText: block.text && ann.start_index !== undefined && ann.end_index !== undefined 
                        ? block.text.substring(ann.start_index, ann.end_index) 
                        : undefined
                    });
                  }
                }
              }
            }
          }
        }
      }

      res.json({ text: textOutput, citations, steps });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response from Gemini" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
