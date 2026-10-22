import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay, Browsers } from "@whiskeysockets/baileys";
import http from "http";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WhatsApp Bot Active");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});

const PHONE_NUMBER = "916282028031";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop")
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        await delay(4000);
        try {
            const code = await sock.requestPairingCode(PHONE_NUMBER);
            console.log("\n=================================");
            console.log(`NEW CODE: ${code}`);
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
            console.log("Message received:", msg.message?.conversation || msg.message?.extendedTextMessage?.text);
        }
    });
}

startBot();
