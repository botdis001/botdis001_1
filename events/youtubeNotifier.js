const Parser = require('rss-parser');
const parser = new Parser();
const { SlashCommandBuilder } = require('discord.js');

// 📌 รายชื่อช่อง YouTube ตั้งต้น (สามารถเพิ่มช่องเริ่มต้นไว้ตรงนี้ได้)
let channelsToTrack = [
    {
        id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        name: 'Google Developers'
    }
];

// เก็บสถานะคลิปล่าสุดของแต่ละช่อง
const latestVideos = new Map();

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('=====================================');
        console.log('🚀 ระบบติดตาม YouTube พร้อมคำสั่งเพิ่มช่องทำงาน');
        console.log('=====================================');

        // 📌 ไอดีห้อง Discord ที่กำหนดให้โพสต์คลิปใหม่
        const YOUTUBE_LOG_CHANNEL_ID = '1205019969796972634'; 

        const checkYouTubeChannels = async () => {
            const channel = client.channels.cache.get(YOUTUBE_LOG_CHANNEL_ID) || await client.channels.fetch(YOUTUBE_LOG_CHANNEL_ID).catch(() => null);
            if (!channel) return;

            for (const sub of channelsToTrack) {
                try {
                    const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${sub.id}`);
                    if (!feed || !feed.items || feed.items.length === 0) continue;

                    const latestVideo = feed.items[0];
                    const videoId = latestVideo.id.split(':')[2];
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                    if (!latestVideos.has(sub.id)) {
                        latestVideos.set(sub.id, videoId);
                        continue;
                    }

                    if (latestVideos.get(sub.id) !== videoId) {
                        latestVideos.set(sub.id, videoId);

                        await channel.send({
                            content: `🚨 **@everyone มีคลิปใหม่จากช่อง ${sub.name} มาแล้ว! รีบไปดูกันเลย!**\n\n📌 **${latestVideo.title}**\n🔗 ${videoUrl}`
                        });
                        
                        console.log(`📢 แจ้งเตือนคลิปใหม่จากช่อง ${sub.name}: ${latestVideo.title}`);
                    }
                } catch (err) {
                    console.error(`❌ เกิดข้อผิดพลาดในการดึงข้อมูลช่อง ${sub.name}:`, err.message);
                }
            }
        };

        // ตั้งเวลาตรวจสอบทุกๆ 5 นาที
        setInterval(checkYouTubeChannels, 5 * 60 * 1000);
        checkYouTubeChannels();
    },

    // 📌 สร้าง Slash Command สำหรับเพิ่มช่อง YouTube
    data: new SlashCommandBuilder()
        .setName('addyoutube')
        .setDescription('เพิ่มช่อง YouTube สำหรับให้บอทติดตามแจ้งเตือนคลิปใหม่')
        .addStringOption(option =>
            option.setName('channel_id')
                .setDescription('Channel ID ของยูทูป (ขึ้นต้นด้วย UC...)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('ชื่อช่องที่จะให้แสดงในข้อความแจ้งเตือน')
                .setRequired(true)),

    async executeCommand(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้ (ต้องเป็นแอดมินเท่านั้น)', ephemeral: true });
        }

        const channelId = interaction.options.getString('channel_id');
        const channelName = interaction.options.getString('name');

        if (!channelId.startsWith('UC')) {
            return await interaction.reply({ content: '❌ Channel ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย UC...)', ephemeral: true });
        }

        const exists = channelsToTrack.find(c => c.id === channelId);
        if (exists) {
            return await interaction.reply({ content: `⚠️ ช่อง **${exists.name}** มีอยู่ในระบบติดตามอยู่แล้วครับ!`, ephemeral: true });
        }

        channelsToTrack.push({ id: channelId, name: channelName });

        await interaction.reply({ 
            content: `✅ **เพิ่มช่อง YouTube สำเร็จ!**\n- ชื่อช่อง: ${channelName}\n- Channel ID: \`${channelId}\``, 
            ephemeral: false 
        });
        
        console.log(`➕ แอดมิน ${interaction.user.tag} ได้เพิ่มช่อง YouTube ใหม่: ${channelName} (${channelId})`);
    }
};
