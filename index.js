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

// นำเข้า Router สำหรับรับพิกัดสภาพอากาศ (ปรับ Path ตามตำแหน่งไฟล์ของคุณ)
const weatherLocationRouter = require('./events/weatherLocationServer');
app.use('/', weatherLocationRouter);

// รัน Express Server
app.listen(PORT, () => {
    console.log(`🌐 Web Server is running on port ${PORT}`);
});

// โค้ดเดิมสำหรับล็อกอินบอท Discord ของคุณ
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.TOKEN);
