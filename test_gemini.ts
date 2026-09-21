import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.1-pro-preview"];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({ model: m, contents: [{role: "user", parts: [{text: "hi"}]}] });
      console.log(m, "success");
    } catch(e) { console.error(m, "fail", e.message); }
  }
}
test();
