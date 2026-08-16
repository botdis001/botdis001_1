const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const WEATHER_CHANNEL_ID = '1538500010172223558';

const GEO_URL =
    'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log('=====================================');
        console.log('🌦️ กำลังเริ่มระบบสภาพอากาศ...');
        console.log('=====================================');

        try {
            // ตรวจสอบ API พื้นที่ก่อน
            const response = await fetch(GEO_URL);

            if (!response.ok) {
                throw new Error(
                    `โหลดข้อมูลพื้นที่ไม่สำเร็จ HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('ข้อมูลจังหวัดว่าง');
            }

            console.log(
                `✅ โหลดข้อมูลประเทศไทยสำเร็จ ${data.length} จังหวัด`
            );

            // ดึงห้อง
            const channel = await client.channels
                .fetch(WEATHER_CHANNEL_ID)
                .catch(() => null);

            if (!channel) {
                console.error(
                    `❌ ไม่พบห้อง Weather ID: ${WEATHER_CHANNEL_ID}`
                );
                return;
            }

            // ลบข้อความเก่าเฉพาะข้อความของบอท
            try {
                const messages = await channel.messages.fetch({
                    limit: 20
                });

                const botMessages = messages.filter(
                    message =>
                        message.author.id === client.user.id
                );

                for (const message of botMessages.values()) {
                    await message.delete().catch(() => {});
                }

                if (botMessages.size > 0) {
                    console.log(
                        `🗑️ ลบข้อความ Weather เก่า ${botMessages.size} ข้อความ`
                    );
                }
            } catch (error) {
                console.error(
                    '⚠️ ลบข้อความ Weather เก่าไม่ได้:',
                    error.message
                );
            }

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(
                    '🌦️ ระบบตรวจสอบสภาพอากาศประเทศไทย'
                )
                .setDescription(
                    'เลือกพื้นที่ที่ต้องการดูสภาพอากาศได้เลยครับ\n\n' +
                    '📍 **จังหวัด → อำเภอ → ตำบล**\n' +
                    '📩 ผลสภาพอากาศจะถูกส่งเข้า **DM ส่วนตัว** ของคุณ\n\n' +
                    '🔄 สามารถกดอัปเดตข้อมูลสภาพอากาศได้ภายหลัง'
                )
                .addFields(
                    {
                        name: '🌡️ ข้อมูลที่แสดง',
                        value:
                            'อุณหภูมิ\n' +
                            'ความชื้น\n' +
                            'รู้สึกเหมือน\n' +
                            'สภาพอากาศ\n' +
                            'ปริมาณฝน\n' +
                            'ความเร็วลม',
                        inline: true
                    },
                    {
                        name: '🌅 ข้อมูลเพิ่มเติม',
                        value:
                            'พระอาทิตย์ขึ้น\n' +
                            'พระอาทิตย์ตก\n' +
                            'อุณหภูมิสูงสุด\n' +
                            'อุณหภูมิต่ำสุด\n' +
                            'โอกาสฝน',
                        inline: true
                    }
                )
                .setFooter({
                    text:
                        `${channel.guild.name} • ระบบสภาพอากาศ`
                })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            'weather_start'
                        )
                        .setLabel(
                            '🌦️ เลือกพื้นที่ดูสภาพอากาศ'
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

            await channel.send({
                embeds: [embed],
                components: [row]
            });

            console.log('=====================================');
            console.log('✅ ระบบสภาพอากาศพร้อมใช้งาน');
            console.log(
                `📌 ห้อง Weather: ${WEATHER_CHANNEL_ID}`
            );
            console.log(
                '📩 ผลลัพธ์ส่งเข้า DM ของผู้ใช้'
            );
            console.log('=====================================');

        } catch (error) {
            console.error(
                '❌ Weather Ready Error:',
                error
            );
        }
    }
};
