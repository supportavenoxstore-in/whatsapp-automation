import TelegramBot from "node-telegram-bot-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Telegram Bot is active and running!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize without polling to clear webhook/conflicts first
const bot = new TelegramBot(token, { polling: false });

async function initBot() {
    try {
        await bot.deleteWebHook();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        await bot.startPolling();
        console.log("Telegram Bot listener started successfully!");
    } catch (err) {
        console.error("Bot initialization error:", err.message);
    }
}

initBot();

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;

    if (!text || text.startsWith("/")) return;

    bot.sendMessage(chatId, "Analyzing product details with AI...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a product listing assistant for a Shopify eCommerce store.
Extract and structure the product information from the text below into a clean format with Title, Price (in INR), Description, and Bullet Points:

${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const details = response.text();

        bot.sendMessage(chatId, `Product Details Ready:\n\n${details}`);
    } catch (error) {
        console.error("Gemini API Error:", error);
        bot.sendMessage(chatId, `AI Processing Error: ${error.message || "Failed to generate details."}`);
    }
});
