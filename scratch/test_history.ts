import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: 'v1beta'
});

async function testHistory() {
  try {
    console.log("Testing interactions.create with history input...");
    const history = [
      { role: "user", parts: [{ text: "Hello, my name is Brian" }] },
      { role: "model", parts: [{ text: "Hi Brian! How can I help you today?" }] }
    ];
    const message = "What is my name?";

    // Test input formats
    const interaction: any = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: [...history, { role: "user", parts: [{ text: message }] }],
      tools: [{ type: 'google_search' }]
    });

    console.log("Output text:", interaction.output_text);
    console.log("Steps:", JSON.stringify(interaction.steps, null, 2));
  } catch (err: any) {
    console.error("History Test Error:", err);
  }
}

testHistory();
