const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// สร้าง Collection สำหรับเก็บ Slash Commands
client.commands = new Collection();
const commandsArray = [];

// โหลดคำสั่ง Slash Commands แบบครอบคลุม (รองรับทั้งไฟล์ตรงและโฟลเดอร์ย่อย)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const items = fs.readdirSync(commandsPath);

    for (const item of items) {
        const itemPath = path.join(commandsPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            const subFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
            for (const file of subFiles) {
                const filePath = path.join(itemPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commandsArray.push(command.data.toJSON());
                }
            }
        } else if (item.endsWith('.js')) {
            const command = require(itemPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
            }
        }
    }
}

// โหลด Events อัตโนมัติจากโฟลเดอร์ events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// แจ้งเตือนเมื่อบอทพร้อมใช้งาน และทำการลงทะเบียน Slash Commands อัตโนมัติ
client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        console.log(`🔄 กำลังลงทะเบียนคำสั่ง ${commandsArray.length} คำสั่ง...`);
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commandsArray }
        );

        console.log('✅ ลงทะเบียนคำสั่งสำเร็จเรียบร้อย!');
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการลงทะเบียนคำสั่ง:', error);
    }
});

// ล็อกอินเข้าสู่ระบบ Discord
client.login(process.env.BOT_TOKEN);
