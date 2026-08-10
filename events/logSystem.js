const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('=====================================');
        console.log('🚀 ระบบ Log (อัปเกรด ID & Message) พร้อมทำงาน');
        console.log('=====================================');

        // 📌 กำหนด ID ห้อง Log ตามที่คุณต้องการ
        const LOG_CHANNEL_ID = '1494379391327928370';       // ห้องสำหรับข้อความแชท/แก้ไข/ลบ
        const VOICE_LOG_ID = '1525003524164026468';         // ห้องสำหรับเข้า-ออกห้องเสียง

        const getTime = () => new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const getChannel = async (id, type) => {
            try {
                return client.channels.cache.get(id) || await client.channels.fetch(id);
            } catch (err) {
                console.error(`❌ ไม่พบห้อง ${type}:`, err.message);
                return null;
            }
        };

        // 🎧 1. ตรวจจับการเข้า-ออก/ย้ายห้องเสียง (พร้อมแสดง ID)
        client.on('voiceStateUpdate', async (oldState, newState) => {
            const member = newState.member || oldState.member;
            if (!member || member.user.bot) return;

            const logChannel = await getChannel(VOICE_LOG_ID, 'บันทึกเสียง');
            if (!logChannel) return;

            try {
                // 🟢 เข้าห้องเสียง
                if (!oldState.channel && newState.channel) {
                    await logChannel.send(`\`\`\`md
# 🟢 เข้าห้องเสียง
- ชื่อสมาชิก: ${member.user.tag}
- User ID: ${member.user.id}
- ห้อง: ${newState.channel.name}
- Channel ID: ${newState.channel.id}
- เวลา: ${getTime()}
\`\`\``);
                }

                // 🔴 ออกจากห้องเสียง
                if (oldState.channel && !newState.channel) {
                    await logChannel.send(`\`\`\`md
# 🔴 ออกจากห้องเสียง
- ชื่อสมาชิก: ${member.user.tag}
- User ID: ${member.user.id}
- ห้อง: ${oldState.channel.name}
- Channel ID: ${oldState.channel.id}
- เวลา: ${getTime()}
\`\`\``);
                }

                // 🔄 ย้ายห้องเสียง
                if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                    await logChannel.send(`\`\`\`md
# 🔄 เปลี่ยนห้องเสียง
- ชื่อสมาชิก: ${member.user.tag}
- User ID: ${member.user.id}
- จากห้อง: ${oldState.channel.name} (${oldState.channel.id})
- ไปห้อง: ${newState.channel.name} (${newState.channel.id})
- เวลา: ${getTime()}
\`\`\``);
                }
            } catch (err) {
                console.error('❌ ส่ง log ห้องเสียงไม่ได้:', err.message);
            }
        });

        // 📝 2. บันทึกข้อความแชทใหม่ (พร้อมแสดง ID)
        client.on('messageCreate', async (message) => {
            if (!message.guild || message.author.bot) return;
            const logChannel = await getChannel(LOG_CHANNEL_ID, 'บันทึกข้อความ');
            if (!logChannel) return;

            const content = message.content || '(ไฟล์ / รูปภาพ)';
            try {
                await logChannel.send(`\`\`\`md
# 📝 ข้อความใหม่
- ผู้ส่ง: ${message.author.tag}
- User ID: ${message.author.id}
- ห้อง: #${message.channel.name} (ID: ${message.channel.id})
- เนื้อหา: ${content.slice(0, 800)}
- เวลา: ${getTime()}
\`\`\``);
            } catch {}
        });

        // 🗑️ 3. บันทึกข้อความที่ถูกลบ (เพิ่มใหม่!)
        client.on('messageDelete', async (message) => {
            if (!message.guild || message.author?.bot) return;
            const logChannel = await getChannel(LOG_CHANNEL_ID, 'บันทึกข้อความลบ');
            if (!logChannel) return;

            const content = message.content || '(ไม่มีข้อความ / อาจเป็นรูปภาพหรือ Embed)';
            try {
                await logChannel.send(`\`\`\`md
# 🗑️ ข้อความถูกลบ
- ผู้ส่ง: ${message.author ? message.author.tag : 'ไม่ทราบผู้ส่ง'}
- User ID: ${message.author ? message.author.id : 'N/A'}
- ห้อง: #${message.channel.name} (ID: ${message.channel.id})
- ข้อความที่ลบ: ${content.slice(0, 800)}
- เวลา: ${getTime()}
\`\`\``);
            } catch {}
        });

        // ✏️ 4. บันทึกข้อความที่ถูกแก้ไข (เพิ่มใหม่!)
        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (!newMessage.guild || newMessage.author?.bot) return;
            if (oldMessage.content === newMessage.content) return; // ถ้าแก้แต่ Embed หรือรูปภาพ ข้ามไป

            const logChannel = await getChannel(LOG_CHANNEL_ID, 'บันทึกข้อความแก้ไข');
            if (!logChannel) return;

            try {
                await logChannel.send(`\`\`\`md
# ✏️ ข้อความถูกแก้ไข
- ผู้แก้ไข: ${newMessage.author.tag}
- User ID: ${newMessage.author.id}
- ห้อง: #${newMessage.channel.name} (ID: ${newMessage.channel.id})
- ข้อความเดิม: ${oldMessage.content || '(ไม่มีข้อความ)'}
- ข้อความใหม่: ${newMessage.content || '(ไม่มีข้อความ)'}
- เวลา: ${getTime()}
\`\`\``);
            } catch {}
        });

        console.log('✅ ระบบ Log ทั้งหมดทำงานสมบูรณ์แล้ว');
    }
};
