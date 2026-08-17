const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า Express ให้เสิร์ฟไฟล์ Static จากโฟลเดอร์ public (เพื่อให้เข้าถึง weather.html ได้)
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

// รัน Express Server
app.listen(PORT, () => {
    console.log(`🌐 Web Server is running on port ${PORT}`);
});

// โค้ดสำหรับล็อกอินบอท Discord
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ใช้ BOT_TOKEN ให้ตรงกับตัวแปรบน Railway ของคุณ
client.login(process.env.BOT_TOKEN);
