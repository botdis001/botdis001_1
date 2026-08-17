const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า Express ให้เสิร์ฟไฟล์ Static จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// เก็บ client ไว้ให้ Express เรียกใช้งานตอนส่ง DM
app.set('discordClient', client);

// นำเข้า Router สำหรับรับพิกัดสภาพอากาศ
const weatherLocationRouter = require('./events/weatherLocationServer');
app.use('/', weatherLocationRouter);

// ระบบโหลด Events อัตโนมัติจากโฟลเดอร์ events
const eventsPath = path.join(__dirname, 'events');
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

// รัน Express Server
app.listen(PORT, () => {
    console.log(`🌐 Web Server is running on port ${PORT}`);
});

// ใช้ clientReady ตามมาตรฐานใหม่ของ Discord.js เพื่อแก้ Warning
client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ล็อกอินบอท Discord โดยใช้ BOT_TOKEN บน Railway
client.login(process.env.BOT_TOKEN);
