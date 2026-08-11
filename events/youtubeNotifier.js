const Parser = require('rss-parser');
const parser = new Parser();

// 📌 รายชื่อช่อง YouTube ตั้งต้น
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
    channelsToTrack, // ส่งออกตัวแปรเพื่อให้ไฟล์คำสั่งเรียกใช้งานและเพิ่มช่องได้
    
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
    }
};
