import TelegramBot from "node-telegram-bot-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

// Keep Render Free Instance alive
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Telegram Bot is running smoothly!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("Telegram Bot listener started successfully!");

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;

    // Ignore commands like /start
    if (!text || text.startsWith("/")) return;

    bot.sendMessage(chatId, "⏳ ഉൽപ്പന്ന വിവരങ്ങൾ AI പരിശോധിക്കുന്നു...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are an eCommerce assistant for Shopify dropshipping. Extract product details from this text and provide Title, Description, Price, and Tags neatly formatted in Malayalam: "${text}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const details = response.text();

        bot.sendMessage(chatId, `🛍️ **ഉൽപ്പന്ന വിവരങ്ങൾ തയ്യാറാണ്:**\n\n${details}`);
    } catch (error) {
        console.error("Gemini Error:", error);
        bot.sendMessage(chatId, "⚠️ വിവരങ്ങൾ പ്രോസസ്സ് ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.");
    }
});
