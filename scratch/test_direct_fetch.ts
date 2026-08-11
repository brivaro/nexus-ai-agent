import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function createInteraction(options: {
  model: string;
  input: any;
  system_instruction?: string;
  tools?: any[];
  apiKey?: string;
}) {
  const key = options.apiKey || apiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${key}`;
  
  const payload: any = {
    model: options.model || "gemini-3.6-flash",
    input: options.input,
  };

  if (options.system_instruction) {
    payload.system_instruction = options.system_instruction;
  }

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
  }

  console.log("Sending direct REST request to interactions API...");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `HTTP ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

async function test() {
  try {
    const prompt = "Hello! Who won Euro 2024?";

    const data = await createInteraction({
      model: "gemini-3.6-flash",
      input: prompt,
      tools: [{ type: "google_search" }]
    });

    console.log("Success! Full Interaction Response:\n", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Direct fetch test error:", err);
  }
}

test();
