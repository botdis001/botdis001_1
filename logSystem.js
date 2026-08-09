module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log('=====================================');
        console.log('🚀 ระบบ Log: เข้า-ออกห้องเสียง พร้อมทำงาน');
        console.log('=====================================');

        // กำหนดไอดีห้องตามที่ต้องการ
        const LOG_CHANNEL_ID = '1494379391327928370';       // ห้องเก่า: ข้อความทั่วไป
        const VOICE_LOG_ID = '1525003524164026468';         // ห้องใหม่: เข้า-ออกห้องเสียง

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

        // 🎧 ตรวจจับทุกการเปลี่ยนแปลงในห้องเสียง
        client.on('voiceStateUpdate', async (oldState, newState) => {
            const member = newState.member || oldState.member;
            if (!member || member.user.bot) return; // ข้ามบอท

            const logChannel = await getChannel(VOICE_LOG_ID, 'บันทึกเสียง');
            if (!logChannel) return;

            try {
                // 🟢 เข้าห้องเสียง
                if (!oldState.channel && newState.channel) {
                    console.log(`✅ ${member.user.tag} เข้าห้องเสียง: ${newState.channel.name}`);
                    await logChannel.send(`\`\`\`md
# 🟢 เข้าห้องเสียง
- ชื่อ: ${member.user.tag}
- ห้อง: ${newState.channel.name}
- เวลา: ${getTime()}
\`\`\``);
                }

                // 🔴 ออกจากห้องเสียง
                if (oldState.channel && !newState.channel) {
                    console.log(`✅ ${member.user.tag} ออกจากห้องเสียง: ${oldState.channel.name}`);
                    await logChannel.send(`\`\`\`md
# 🔴 ออกจากห้องเสียง
- ชื่อ: ${member.user.tag}
- ห้อง: ${oldState.channel.name}
- เวลา: ${getTime()}
\`\`\``);
                }

                // 🔄 ย้ายห้องเสียง
                if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                    console.log(`✅ ${member.user.tag} ย้ายห้อง: ${oldState.channel.name} → ${newState.channel.name}`);
                    await logChannel.send(`\`\`\`md
# 🔄 เปลี่ยนห้องเสียง
- ชื่อ: ${member.user.tag}
- จาก: ${oldState.channel.name}
- ไป: ${newState.channel.name}
- เวลา: ${getTime()}
\`\`\``);
                }
            } catch (err) {
                console.error('❌ ส่ง log ห้องเสียงไม่ได้:', err.message);
            }
        });

        // 📝 บันทึกข้อความแชทปกติ
        client.on('messageCreate', async (message) => {
            if (!message.guild || message.author.bot) return;
            const logChannel = await getChannel(LOG_CHANNEL_ID, 'บันทึกข้อความ');
            if (!logChannel) return;

            const content = message.content || '(ไฟล์ / รูปภาพ)';
            try {
                await logChannel.send(`\`\`\`md
# 📝 ข้อความใหม่
- ผู้ส่ง: ${message.author.tag}
- ห้อง: #${message.channel.name}
- เนื้อหา: ${content.slice(0, 800)}
- เวลา: ${getTime()}
\`\`\``);
            } catch {}
        });

        console.log('✅ ระบบทำงานครบถ้วนแล้ว');
    }
};