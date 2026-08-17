const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

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

// 🌐 ตั้งค่า Express Web Server สำหรับรองรับหน้าเว็บ Weather HTML
const app = express();
const PORT = process.env.PORT || 8080;

// ให้บริการไฟล์ Static จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint รองรับการรับค่าพิกัดจากหน้าเว็บ weather.html
app.get('/weather-location', async (req, res) => {
    const { userId, lat, lon } = req.query;
    
    if (!userId || !lat || !lon) {
        return res.send('❌ ข้อมูลไม่ครบถ้วน กรุณาลองใหม่อีกครั้งผ่าน Discord');
    }

    try {
        const user = await client.users.fetch(userId);
        if (user) {
            await user.send(`📍 ได้รับพิกัดของคุณเรียบร้อยแล้ว!\nLatitude: ${lat}\nLongitude: ${lon}\n*(ระบบกำลังประมวลผลสภาพอากาศ...)*`);
            res.send('<h2>✅ ส่งพิกัดไปยังบอทสำเร็จแล้ว! คุณสามารถปิดหน้านี้และกลับไปดูที่ Discord ได้เลยครับ</h2>');
        } else {
            res.send('❌ ไม่พบผู้ใช้งานในระบบ Discord');
        }
    } catch (error) {
        console.error('❌ Error handling location:', error);
        res.send('❌ เกิดข้อผิดพลาดในการส่งข้อมูลไปยังบอท');
    }
});

// เริ่มต้นรัน Express Server โดยใช้พอร์ตจาก Railway หรือ 8080
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web Server กำลังรันอยู่ที่พอร์ต ${PORT}`);
});

// 🔄 ระบบโหลด Slash Commands
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const itemPath = path.join(foldersPath, folder);
        
        if (fs.lstatSync(itemPath).isDirectory()) {
            const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const cmd = require(path.join(itemPath, file));
                    if (cmd.data && cmd.execute) {
                        client.commands.set(cmd.data.name, cmd);
                    }
                } catch (e) { 
                    console.error(`❌ โหลดคำสั่งไม่ได้: ${file}`, e.message); 
                }
            }
        } else if (folder.endsWith('.js')) {
            try {
                const cmd = require(itemPath);
                if (cmd.data && cmd.execute) {
                    client.commands.set(cmd.data.name, cmd);
                }
            } catch (e) { 
                console.error(`❌ โหลดคำสั่งไม่ได้: ${folder}`, e.message); 
            }
        }
    }
}

// 🔄 โหลดเหตุการณ์ (Events)
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
        } else (e) { 
            console.error(`❌ โหลดเหตุการณ์ไม่ได้: ${file}`, e.message); 
        }
    }
}

client.on('error', e => console.error('❌ Error:', e.message));
process.on('unhandledRejection', e => console.error('❌ Unhandled:', e.message));

// 🔑 ตรวจสอบ Token
const token = process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ ไม่พบ Token ของบอท กรุณาตั้งค่า BOT_TOKEN หรือ DISCORD_TOKEN ใน Environment Variables');
    process.exit(1);
}

client.login(token);
