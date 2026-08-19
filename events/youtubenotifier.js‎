const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const parser = new Parser();

// 📌 เอาช่อง Google ออกแล้ว (สามารถใส่ช่อง YouTube ที่ต้องการติดตามเพิ่มได้ที่นี่)
let channelsToTrack = [];

const latestVideos = new Map();

module.exports = {
    name: 'ready',
    once: true,
    channelsToTrack,
    
    async execute(client) {
        console.log('=====================================');
        console.log('🚀 ระบบติดตาม YouTube ทำงานแล้ว');
        console.log('=====================================');

        const YOUTUBE_LOG_CHANNEL_ID = '1205019969796972634'; 

        const checkYouTubeChannels = async () => {
            if (channelsToTrack.length === 0) return;

            const channel = await client.channels.fetch(YOUTUBE_LOG_CHANNEL_ID).catch(() => null);
            if (!channel) return;

            for (const sub of channelsToTrack) {
                try {
                    const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${sub.id}`);
                    if (!feed || !feed.items || feed.items.length === 0) continue;

                    const latestVideo = feed.items[0];
                    const videoId = latestVideo.id.split(':')[2];
                    const videoUrl = latestVideo.link;

                    if (!latestVideos.has(sub.id)) {
                        latestVideos.set(sub.id, videoId);
                        continue;
                    }

                    if (latestVideos.get(sub.id) !== videoId) {
                        latestVideos.set(sub.id, videoId);

                        // สร้าง Embed สวยๆ สำหรับแจ้งเตือน
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000') // สีแดงสไตล์ YouTube
                            .setTitle(`🎬 ${latestVideo.title}`)
                            .setURL(videoUrl)
                            .setAuthor({ name: sub.name, iconURL: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' })
                            .setDescription(`มีคลิปใหม่จากช่อง **${sub.name}** มาแล้วครับ! อย่าลืมไปรับชมกันนะ`)
                            .setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`) // ดึงปกคลิปมาแสดง
                            .setTimestamp()
                            .setFooter({ text: 'YouTube Notification System' });

                        await channel.send({
                            content: `🚨 **@everyone มีคลิปใหม่มาแล้ว!**`,
                            embeds: [embed]
                        });
                        
                        console.log(`📢 แจ้งเตือนคลิปใหม่จากช่อง ${sub.name}: ${latestVideo.title}`);
                    }
                } catch (err) {
                    console.error(`❌ ข้อผิดพลาดที่ช่อง ${sub.name}:`, err.message);
                }
            }
        };

        setInterval(checkYouTubeChannels, 5 * 60 * 1000);
        checkYouTubeChannels();
    }
};
