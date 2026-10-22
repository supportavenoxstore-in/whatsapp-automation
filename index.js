import TelegramBot from "node-telegram-bot-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Telegram Automation Bot is live!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

console.log("Telegram Bot listener started successfully!");

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;

    if (!text || text.startsWith("/")) return;

    bot.sendMessage(chatId, "⏳ ഉൽപ്പന്ന വിവരങ്ങൾ AI പരിശോധിക്കുന്നു...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a product listing expert for a Shopify store.
Format the following supplier product message into a clean, professional product listing in Malayalam with proper titles, pricing in INR, description, and bullet points.

Text:
${text}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const details = response.text();

        bot.sendMessage(chatId, `🛍️ **തയ്യാറാക്കിയ ഉൽപ്പന്ന വിവരങ്ങൾ:**\n\n${details}`);
    } catch (error) {
        console.error("Gemini API Error Detail:", error);
        bot.sendMessage(chatId, `⚠️ AI Error: ${error.message || "വിവരങ്ങൾ ലഭ്യമാക്കാൻ കഴിഞ്ഞില്ല"}`);
    }
});
