import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const prompt = "saare message aur announcement delete kar do";
  const systemInstruction = `Available Actions you can output in the "actions" array:
4. "CREATE_ANNOUNCEMENT": When user asks to make an announcement. Provide 'message' and 'audience'.
5. "REPLY_MESSAGES": When user asks to reply to a normal chat. Provide 'message' and 'audience'.
6. "DELETE_CHATS": When user asks to clear chats. Provide 'audience'.
`;
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json"
    }
  });
  console.log(response.text);
}
test();
