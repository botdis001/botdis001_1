module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('🎵 ระบบเสียง + เปิดเพลง เริ่มทำงานแล้ว');

        // ✅ เรียกใช้ Player ที่สร้างไว้ใน index.js
        const player = client.player;

        // ปรับคุณภาพเสียงเริ่มต้น
        player.events.on('playerStart', (queue) => {
            queue.filters.ffmpeg.setFilters([
                'highpass=f=80',       // ตัดเสียงความถี่ต่ำเกินไป
                'lowpass=f=15000',     // ตัดเสียงแหลมจัดเกินไป
                'equalizer=f=100:t=h:w=200:g=2',   // เพิ่มเบส
                'equalizer=f=3000:t=h:w=200:g=1.5' // เพิ่มความชัด
            ]);
        });

        // คำสั่งใช้งาน
        client.on('messageCreate', async (message) => {
            if (!message.guild || message.author.bot) return;
            const prefix = '!';

            // เปิดเพลง
            if (message.content.startsWith(`${prefix}play`)) {
                const query = message.content.slice(6).trim();
                if (!query) return message.reply('❌ พิมพ์ชื่อเพลงหรือลิงก์มาด้วยนะครับ');

                const voiceChannel = message.member.voice.channel;
                if (!voiceChannel) return message.reply('❌ ต้องเข้าห้องเสียงก่อนเปิดเพลงนะครับ');

                try {
                    const result = await player.search(query, { requestedBy: message.author });
                    if (!result.hasTracks()) return message.reply('❌ หาเพลงไม่เจอครับ');

                    await player.play(voiceChannel, result.tracks[0], {
                        nodeOptions: {
                            metadata: message,
                            bitrate: 128, // คุณภาพเสียงสูงสุดสำหรับเซิร์ฟฟรี
                            volume: 70
                        }
                    });

                    message.reply(`✅ กำลังเปิดเพลง: **${result.tracks[0].title}** 🎵`);
                } catch (err) {
                    console.error(err);
                    message.reply('❌ เปิดเพลงไม่ได้ครับ');
                }
            }

            // เพิ่มเบส
            if (message.content === `${prefix}bass`) {
                const queue = player.nodes.get(message.guild.id);
                if (!queue || !queue.isPlaying()) return message.reply('❌ ไม่มีเพลงกำลังเล่นอยู่ครับ');
                queue.filters.ffmpeg.setFilters(['equalizer=f=100:t=h:w=200:g=3']);
                message.reply('🔊 เพิ่มเสียงเบสเรียบร้อยแล้ว');
            }

            // เพิ่มความชัด
            if (message.content === `${prefix}clear`) {
                const queue = player.nodes.get(message.guild.id);
                if (!queue || !queue.isPlaying()) return message.reply('❌ ไม่มีเพลงกำลังเล่นอยู่ครับ');
                queue.filters.ffmpeg.setFilters(['equalizer=f=3000:t=h:w=200:g=2.5']);
                message.reply('✨ เพิ่มความชัดเจนของเสียงเรียบร้อยแล้ว');
            }

            // หยุดเพลง
            if (message.content === `${prefix}stop`) {
                const queue = player.nodes.get(message.guild.id);
                if (!queue || !queue.isPlaying()) return message.reply('❌ ไม่มีเพลงกำลังเล่นอยู่ครับ');
                queue.delete();
                message.reply('⏹️ หยุดเพลงและออกจากห้องเสียงแล้วครับ');
            }
        });
    }
};