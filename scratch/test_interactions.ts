import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: 'v1beta'
});

async function test() {
  try {
    console.log("Testing ai.interactions.create with apiVersion: v1beta...");
    const interaction: any = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: 'Who won Euro 2024?',
      tools: [{ type: 'google_search' }]
    });

    console.log("Output text:", interaction.output_text);
    console.log("Steps:", JSON.stringify(interaction.steps, null, 2));
  } catch (err: any) {
    console.error("Error:", err);
  }
}

test();
