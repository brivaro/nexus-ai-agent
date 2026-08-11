import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testAll() {
  console.log("=== Testing URL Context ===");
  try {
    const resUrl: any = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: 'Summarize the content of https://example.com',
      tools: [{ type: 'url_context' }]
    });
    console.log("URL Context Output:", resUrl.output_text);
    console.log("Steps:", JSON.stringify(resUrl.steps, null, 2));
  } catch (e: any) {
    console.error("URL Context Error:", e);
  }

  console.log("\n=== Testing Google Maps ===");
  try {
    const resMaps: any = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: 'Best coffee shops in Downtown Los Angeles',
      tools: [{
        type: 'google_maps',
        latitude: 34.050481,
        longitude: -118.248526
      }]
    });
    console.log("Google Maps Output:", resMaps.output_text);
    console.log("Steps:", JSON.stringify(resMaps.steps, null, 2));
  } catch (e: any) {
    console.error("Google Maps Error:", e);
  }
}

testAll();
