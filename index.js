import TelegramBot from "node-telegram-bot-api";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Telegram Bot is running smoothly!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

const bot = new TelegramBot(token, {
    polling: {
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

bot.on("polling_error", (error) => {
    if (error.code !== "EFATAL") {
        // Suppress repetitive polling notices
    }
});

console.log("Telegram Bot listener started successfully!");

// Recommended Gemini 3.5 Flash Lite API call
async function requestGemini(modelName, text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const body = {
        contents: [
            {
                parts: [
                    {
                        text: `You are a product listing assistant for a Shopify eCommerce store. Extract and organize the product information from the text below into a clean listing with Title, Price in INR, Description, and Bullet Points:\n\n${text}`
                    }
                ]
            }
        ]
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates[0].content.parts[0].text;
}

async function generateProductDetails(text) {
    // Priority to gemini-3.5-flash-lite as advised by Google API
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];
    let lastError = null;

    for (const model of modelsToTry) {
        try {
            return await requestGemini(model, text);
        } catch (err) {
            console.log(`Model ${model} busy/failed, trying next...`);
            lastError = err;
        }
    }

    throw lastError;
}

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;

    if (!text || text.startsWith("/")) return;

    bot.sendMessage(chatId, "Analyzing product details with AI...");

    try {
        const details = await generateProductDetails(text);
        bot.sendMessage(chatId, `Product Details Ready:\n\n${details}`);
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        bot.sendMessage(chatId, `AI Processing Error: ${error.message}`);
    }
});
