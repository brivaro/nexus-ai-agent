import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function testRest(apiVersion: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
  const body = {
    model: "gemini-3.6-flash",
    input: "Who won Euro 2024?",
    tools: [{ type: "google_search" }]
  };

  console.log(`Sending REST POST to (${apiVersion}):`, url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  console.log("Status:", res.status, res.statusText);
  const data = await res.json();
  console.log("Response data:", JSON.stringify(data, null, 2));
}

testRest("v1beta");
