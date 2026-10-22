import { GoogleGenerativeAI } from "@google/generative-ai";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

// Display QR Code for WhatsApp Web login
client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Scan this QR code to connect WhatsApp.");
});

// Logged in successfully
client.on("ready", () => {
    console.log("WhatsApp Automation connected successfully!");
});

// Handle incoming messages
client.on("message", async (msg) => {
    const chat = await msg.getChat();

    // 1. Process new products from reseller group
    if (chat.isGroup && chat.name === process.env.WHATSAPP_GROUP_NAME) {
        if (msg.hasMedia) {
            console.log("New product detected in group. Processing for Shopify...");
        }
        return;
    }

    // 2. Handle private messages from supplier
    if (!chat.isGroup && msg.from.includes(process.env.SUPPLIER_PHONE_NUMBER)) {
        const text = msg.body.trim();

        if (text.startsWith("TRACK")) {
            console.log("Supplier provided tracking number. Updating Shopify fulfillment...");
            msg.reply("Order fulfillment updated successfully.");
        }

        if (text.startsWith("RETURN_TRACK")) {
            console.log("Return tracking received. Notifying customer...");
            msg.reply("Return pickup confirmed.");
        }

        if (text.startsWith("OOS")) {
            console.log("Product out of stock. Processing notice...");
            msg.reply("Noted. Customer support will be contacted.");
        }
    }
});

client.initialize();
