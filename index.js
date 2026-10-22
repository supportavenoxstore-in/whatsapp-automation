import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const PHONE_NUMBER = "916282028031";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log("\n=================================");
                console.log(`YOUR WHATSAPP PAIRING CODE IS: ${code}`);
                console.log("=================================\n");
            } catch (err) {
                console.error("Pairing code error:", err);
            }
        }, 4000);
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
            console.log("New message received:", msg.message?.conversation || msg.message?.extendedTextMessage?.text);
        }
    });
}

startBot();
