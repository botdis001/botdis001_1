const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const WEATHER_CHANNEL_ID = '1538500010172223558';
const WEB_APP_URL = 'https://botdis0011-production.up.railway.app/weather.html';
const GEO_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

module.exports = {
    name: 'ready', // เปลี่ยนชื่อ event เพื่อป้องกันการรันซ้ำกับ file อื่น
    once: true,

    async execute(client) {
        console.log('=====================================');
        console.log('🌦️ เริ่มระบบสภาพอากาศ (ฉบับแก้ไขส่งซ้ำ)...');
        console.log('=====================================');

        const channel = await client.channels.fetch(WEATHER_CHANNEL_ID).catch(() => null);
        if (!channel) return console.error(`❌ ไม่พบห้อง Weather ID: ${WEATHER_CHANNEL_ID}`);

        try {
            // 1. ลบข้อความเก่าของบอทออกให้หมดก่อน
            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);
            if (botMessages.size > 0) {
                await channel.bulkDelete(botMessages, true).catch(console.error);
                console.log(`🗑️ ล้างข้อความเก่าออก ${botMessages.size} ข้อความ`);
            }

            // 2. โหลดข้อมูลจังหวัด
            const response = await fetch(GEO_URL);
            const data = await response.json();

            // 3. สร้าง Embed และส่งข้อความใหม่
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🌦️ ระบบตรวจสอบสภาพอากาศประเทศไทย')
                .setDescription(
                    'เลือกวิธีตรวจสอบสภาพอากาศที่คุณต้องการได้เลยครับ:\n\n' +
                    '📍 **วิธีที่ 1:** กดปุ่ม **"📍 เช็กสภาพอากาศตามตำแหน่งของฉัน"** เพื่อตรวจสอบพิกัดปัจจุบัน\n' +
                    '🗺️ **วิธีที่ 2:** กดปุ่ม **"🗺️ เลือกจังหวัด / ตำบล"** เพื่อเลือกพื้นที่เอง\n\n' +
                    '📩 ผลสภาพอากาศจะถูกส่งเข้า **DM ส่วนตัว** ของคุณ'
                )
                .addFields(
                    { name: '🌡️ ข้อมูลที่แสดง', value: 'อุณหภูมิ\nความชื้น\nรู้สึกเหมือน\nสภาพอากาศ\nปริมาณฝน\nความเร็วลม', inline: true },
                    { name: '🌅 ข้อมูลเพิ่มเติม', value: 'พระอาทิตย์ขึ้น\nพระอาทิตย์ตก\nอุณหภูมิสูงสุด\nอุณหภูมิต่ำสุด\nโอกาสฝน', inline: true }
                )
                .setFooter({ text: `${channel.guild.name} • ระบบสภาพอากาศ` })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('📍 เช็กสภาพอากาศตามตำแหน่งของฉัน')
                    .setStyle(ButtonStyle.Link)
                    .setURL(WEB_APP_URL),
                new ButtonBuilder()
                    .setCustomId('weather_start')
                    .setLabel('🗺️ เลือกจังหวัด / ตำบล')
                    .setStyle(ButtonStyle.Primary)
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log('✅ ส่งข้อความสำเร็จ');

        } catch (error) {
            console.error('❌ Error ในการส่งข้อความ:', error);
        }
    }
};
