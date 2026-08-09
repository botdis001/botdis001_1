const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ✅ นำเข้า Player และ DefaultExtractors เวอร์ชันล่าสุด
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],
    partials: ['GUILD_MEMBER', 'USER', 'MESSAGE', 'CHANNEL']
});

client.commands = new Collection();

// ✅ เริ่มต้น Player และแก้บั๊ก Error โหลดเพลงแบบใหม่
const player = new Player(client);
(async () => {
    await player.extractors.loadMulti(DefaultExtractors);
})();
client.player = player; 

// 🔄 แก้ไขระบบโหลดคำสั่ง: ให้สามารถอ่านโฟลเดอร์ย่อยใน commands ได้ทั้งหมด
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        
        // เช็กว่าเป็นโฟลเดอร์ใช่ไหมก่อนจะอ่านไฟล์ข้างใน
        if (fs.lstatSync(commandsPath).isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const cmd = require(path.join(commandsPath, file));
                    if (cmd.data && cmd.execute) {
                        client.commands.set(cmd.data.name, cmd);
                    }
                } catch (e) { 
                    console.error(`❌ โหลดคำสั่งไม่ได้: ${file}`, e.message); 
                }
            }
        }
    }
}

// โหลดเหตุการณ์ (Events)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            if (!event.name || typeof event.execute !== 'function') continue;

            if (event.once) {
                if (event.name === 'clientReady' || event.name === 'ready') {
                    client.once('ready', async () => {
                        console.log(`🔄 เรียกใช้เหตุการณ์: ${event.name}`);
                        await event.execute(client);
                    });
                } else {
                    client.once(event.name, (...args) => event.execute(...args));
                }
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } catch (e) { console.error(`❌ โหลดเหตุการณ์ไม่ได้: ${file}`, e.message); }
    }
}

client.once('ready', () => {
    console.log(`✅ บอทออนไลน์: ${client.user.tag}`);
    console.log(`🎵 ระบบเสียงเริ่มต้นเรียบร้อย`);
});

client.on('error', e => console.error('❌ Error:', e.message));
process.on('unhandledRejection', e => console.error('❌ Unhandled:', e.message));

// 🔑 ปรับปรุงให้รองรับทั้ง BOT_TOKEN และ DISCORD_TOKEN ป้องกันปัญหาลืมตั้งค่าตัวแปร
const token = process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ไม่พบ Token ของบอท กรุณาตั้งค่า BOT_TOKEN หรือ DISCORD_TOKEN ใน Environment Variables');
    process.exit(1);
}

client.login(token);