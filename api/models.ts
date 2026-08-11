import { GoogleGenAI } from "@google/genai";

function createClient(apiKey?: string) {
  return new GoogleGenAI({
    apiKey: apiKey || process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = typeof req.query?.apiKey === "string" ? req.query.apiKey : undefined;
    const client = createClient(apiKey);
    const response = await client.models.list();

    let items: any[] = [];
    if (response && (response as any).items) {
      items = (response as any).items;
    } else if (response && Array.isArray(response)) {
      items = response;
    } else if (Symbol.asyncIterator in Object(response)) {
      for await (const item of response as any) {
        items.push(item);
      }
    } else if (Symbol.iterator in Object(response)) {
      for (const item of response as any) {
        items.push(item);
      }
    }

    const availableModels = items
      .filter((m: any) => {
        const actions = m.supportedActions || [];
        return (
          actions.includes("generateContent") ||
          actions.includes("bidiGenerateContent") ||
          actions.length === 0
        );
      })
      .map((m: any) => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name,
        description: m.description,
        version: m.version,
      }));

    res.status(200).json(availableModels);
  } catch (error: any) {
    console.error("Models API Error:", error);
    res.status(500).json({ error: error.message || "Failed to list models" });
  }
}
