import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from "@whiskeysockets/baileys";
import http from "http";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

// Keep Render Free Web Service alive
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WhatsApp Bot is active and running!");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Web server listening on port ${PORT}`);
});

const PHONE_NUMBER = "916282028031";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        await delay(5000);
        try {
            const code = await sock.requestPairingCode(PHONE_NUMBER);
            console.log("\n=================================");
            console.log(`YOUR NEW PAIRING CODE IS: ${code}`);
            console.log("=================================\n");
        } catch (err) {
            console.error("Pairing code error:", err);
        }
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("\n>>> WhatsApp Automation connected successfully! <<<\n");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === "notify") {
            console.log("New message:", msg.message?.conversation || msg.message?.extendedTextMessage?.text);
        }
    });
}

startBot();
