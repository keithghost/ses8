const zlib = require('zlib'); // For compression
const PastebinAPI = require('pastebin-js'),
pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: Keith_Keizzah,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Media URLs and content arrays
const media = {
    audioUrls: [
        "https://files.catbox.moe/hpwsi2.mp3",
        "https://files.catbox.moe/xci982.mp3",
        // ... (rest of audio URLs)
    ],
    videoUrls: [
        "https://i.imgur.com/Zuun5CJ.mp4",
        "https://i.imgur.com/tz9u2RC.mp4",
        // ... (rest of video URLs)
    ],
    factsAndQuotes: [
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Success is not final, failure is not fatal...",
        // ... (rest of quotes)
    ]
};

// Helper functions
const helpers = {
    getRandomItem: (array) => array[Math.floor(Math.random() * array.length)],
    removeFile: (filePath) => {
        if (!fs.existsSync(filePath)) return false;
        fs.rmSync(filePath, { recursive: true, force: true });
    }
};

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function generateKeithPairCode() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        
        try {
            let keithBot = Keith_Keizzah({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                  browser: Browsers.macOS('brave')
            });
            if (!keithBot.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await keithBot.requestPairingCode(num);
                if (!res.headersSent) await res.send({ code });
            }

            keithBot.ev.on('creds.update', saveCreds);
            keithBot.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await keithBot.newsletterFollow("120363419117330635@newsletter");
                await keithBot.groupAcceptInvite("KOvNtZbE3JC32oGAe6BQpp");
 
                    await delay(50000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(8000);

                    // Compress and encode session data
                    let sessionData = zlib.gzipSync(data).toString('base64');

                    // Send session data
                    await keithBot.sendMessage(keithBot.user.id, {
                        text: 'ALPHA;;;' + sessionData
                    });

                    // Send random media content
                    await keithBot.sendMessage(keithBot.user.id, { 
                        video: { url: helpers.getRandomItem(media.videoUrls) },
                        caption: helpers.getRandomItem(media.factsAndQuotes) 
                    });

                    // Send random audio
                    await keithBot.sendMessage(keithBot.user.id, { 
                        audio: { url: helpers.getRandomItem(media.audioUrls) },
                        mimetype: 'audio/mp4',
                        ptt: true,
                        waveform: [100, 0, 100, 0, 100, 0, 100],
                        contextInfo: {
                            mentionedJid: [keithBot.user.id],
                            externalAdReply: {
                                title: 'Thanks for choosing 𝗞𝗲𝗶𝘁𝗵 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 happy deployment 💜',
                                body: 'Regards Keithkeizzah',
                                thumbnailUrl: 'https://i.imgur.com/vTs9acV.jpeg',
                                sourceUrl: 'https://whatsapp.com/channel/0029Vaan9TF9Bb62l8wpoD47',
                                mediaType: 1,
                                renderLargerThumbnail: true,
                            },
                        },
                    });

                    await delay(100);
                    await keithBot.ws.close();
                    return helpers.removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect?.error?.output.statusCode != 401) {
                    await delay(10000);
                    generateKeithPairCode();
                }
            });
        } catch (err) {
            console.log("service restarted", err);
            helpers.removeFile('./temp/' + id);
            if (!res.headersSent) await res.send({ code: "Service is Currently Unavailable" });
        }
    }

    return await generateKeithPairCode();
});

module.exports = router;
