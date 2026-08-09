const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // สำคัญมากสำหรับระบบต้อนรับและยศ
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],
    partials: ['GUILD_MEMBER', 'USER', 'MESSAGE', 'CHANNEL']
});

client.commands = new Collection();

// 🔄 ระบบโหลดคำสั่ง (รองรับทั้งโฟลเดอร์ย่อย)
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        
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

// 🔄 โหลดเหตุการณ์ (Events) อัตโนมัติจากโฟลเดอร์ events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsPath, file));
            if (!event.name || typeof event.execute !== 'function') continue;

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            console.log(`📂 โหลด Event สำเร็จ: ${file}`);
        } catch (e) { 
            console.error(`❌ โหลดเหตุการณ์ไม่ได้: ${file}`, e.message); 
        }
    }
}

// ✅ ระบบดักจับข้อความคำสั่งขึ้นต้นด้วยเครื่องหมายตกใจ (!) เช่น !updatebutton
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (fs.lstatSync(commandsPath).isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const cmd = require(path.join(commandsPath, file));
                    if (cmd.name === commandName && typeof cmd.execute === 'function') {
                        await cmd.execute(message, args);
                    }
                } catch (error) {
                    console.error(`❌ Error executing command ${file}:`, error);
                }
            }
        }
    }
});

client.on('error', e => console.error('❌ Error:', e.message));
process.on('unhandledRejection', e => console.error('❌ Unhandled:', e.message));

// 🔑 ตรวจสอบ Token
const token = process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ไม่พบ Token ของบอท กรุณาตั้งค่า BOT_TOKEN หรือ DISCORD_TOKEN ใน Environment Variables');
    process.exit(1);
}

client.login(token);
