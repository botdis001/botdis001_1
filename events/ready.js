const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const WEATHER_CHANNEL_ID = '1538500010172223558';
const GEO_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);

        // --- 1. ระบบลงทะเบียน ---
        const ROLE_CHANNEL_ID = '1486030638464237631';
        try {
            const channel = await client.channels.fetch(ROLE_CHANNEL_ID);
            if (channel) {
                const messages = await channel.messages.fetch({ limit: 10 });
                const existingBotMsg = messages.find(msg => msg.author.id === client.user.id);

                if (!existingBotMsg) {
                    const embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle(`✨ ยินดีต้อนรับสู่ ${channel.guild.name}`)
                        .setDescription(
                            'ยินดีต้อนรับสมาชิกใหม่ทุกท่านเข้าสู่เซิร์ฟเวอร์ของเราครับ!\n\n' +
                            '📋 **ขั้นตอนการลงทะเบียน & รับยศเกม**\n\n' +
                            '1️⃣ กดปุ่ม **ลงทะเบียน / ตั้งชื่อและรับยศ**\n' +
                            '2️⃣ กรอกชื่อที่ต้องการใช้ในเซิร์ฟเวอร์\n' +
                            '3️⃣ กรอก Steam ID64 จำนวน 17 หลัก\n' +
                            '4️⃣ ระบบตรวจสอบ Steam และ VAC อัตโนมัติ\n' +
                            '5️⃣ เลือกเกมที่ต้องการรับยศ\n' +
                            '6️⃣ ระบบเปลี่ยนชื่อและมอบยศเกมให้โดยอัตโนมัติ\n\n' +
                            '📌 **ตัวอย่าง Steam ID64**\n' +
                            '`7656119XXXXXXXXXX`\n\n' +
                            '⚠️ กรุณากรอก Steam ID64 ของบัญชี Steam ของคุณเอง'
                        )
                        .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                        .addFields(
                            { name: '🔒 ความปลอดภัย', value: 'ตรวจสอบ Steam และ VAC อัตโนมัติ', inline: true },
                            { name: '🎮 เลือกเกม', value: 'เลือกเกมเพื่อรับยศ', inline: true },
                            { name: '💎 สิทธิพิเศษ', value: 'รับยศเกมที่เลือก', inline: true }
                        )
                        .setFooter({
                            text: `${channel.guild.name} • ระบบจัดการสมาชิกอัตโนมัติ`,
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    const button = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('modal_role_trigger')
                            .setLabel('ลงทะเบียน / ตั้งชื่อและรับยศ')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎉')
                    );

                    await channel.send({ embeds: [embed], components: [button] });
                }
                console.log('✅ ระบบลงทะเบียนพร้อมใช้งาน');
            }
        } catch (error) {
            console.error('❌ Error ระบบลงทะเบียน:', error);
        }

        // --- 2. ระบบสภาพอากาศ ---
        console.log('=====================================');
        console.log('🌦️ กำลังเริ่มระบบสภาพอากาศ...');
        console.log('=====================================');

        try {
            const response = await fetch(GEO_URL);

            if (!response.ok) {
                throw new Error(`โหลดข้อมูลพื้นที่ไม่สำเร็จ HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('ข้อมูลจังหวัดว่าง');
            }

            console.log(`✅ โหลดข้อมูลประเทศไทยสำเร็จ ${data.length} จังหวัด`);

            const weatherChannel = await client.channels
                .fetch(WEATHER_CHANNEL_ID)
                .catch(() => null);

            if (!weatherChannel) {
                console.error(`❌ ไม่พบห้อง Weather ID: ${WEATHER_CHANNEL_ID}`);
                return;
            }

            try {
                const messages = await weatherChannel.messages.fetch({ limit: 20 });
                const botMessages = messages.filter(message => message.author.id === client.user.id);

                for (const message of botMessages.values()) {
                    await message.delete().catch(() => {});
                }

                if (botMessages.size > 0) {
                    console.log(`🗑️ ลบข้อความ Weather เก่า ${botMessages.size} ข้อความ`);
                }
            } catch (error) {
                console.error('⚠️ ลบข้อความ Weather เก่าไม่ได้:', error.message);
            }

            const weatherEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🌦️ ระบบตรวจสอบสภาพอากาศประเทศไทย')
                .setDescription(
                    'เลือกวิธีตรวจสอบสภาพอากาศที่คุณต้องการได้เลยครับ:\n\n' +
                    '📍 **วิธีที่ 1:** กดปุ่ม **"📍 เช็กสภาพอากาศตามตำแหน่งของฉัน"** เพื่อตรวจสอบพิกัดปัจจุบัน\n' +
                    '🗺️ **วิธีที่ 2:** กดปุ่ม **"🗺️ เลือกจังหวัด / ตำบล"** เพื่อเลือกพื้นที่เอง\n\n' +
                    '📩 ผลสภาพอากาศจะถูกส่งเข้า **DM ส่วนตัว** ของคุณ'
                )
                .addFields(
                    {
                        name: '🌡️ ข้อมูลที่แสดง',
                        value: 'อุณหภูมิ\nความชื้น\nรู้สึกเหมือน\nสภาพอากาศ\nปริมาณฝน\nความเร็วลม',
                        inline: true
                    },
                    {
                        name: '🌅 ข้อมูลเพิ่มเติม',
                        value: 'พระอาทิตย์ขึ้น\nพระอาทิตย์ตก\nอุณหภูมิสูงสุด\nอุณหภูมิต่ำสุด\nโอกาสฝน',
                        inline: true
                    }
                )
                .setFooter({
                    text: `${weatherChannel.guild.name} • ระบบสภาพอากาศ`
                })
                .setTimestamp();

            const weatherRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('weather_location_link') // ใช้ CustomId เพื่อให้บอทรู้ว่าใครกดและสร้างลิงก์แนบ userId ให้
                    .setLabel('📍 เช็กสภาพอากาศตามตำแหน่งของฉัน')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('weather_start')
                    .setLabel('🗺️ เลือกจังหวัด / ตำบล')
                    .setStyle(ButtonStyle.Primary)
            );

            await weatherChannel.send({
                embeds: [weatherEmbed],
                components: [weatherRow]
            });

            console.log('=====================================');
            console.log('✅ ระบบสภาพอากาศพร้อมใช้งาน');
            console.log(`📌 ห้อง Weather: ${WEATHER_CHANNEL_ID}`);
            console.log('=====================================');

        } catch (error) {
            console.error('❌ Weather Ready Error:', error);
        }

        console.log('=====================================');
        console.log('🚀 ระบบทั้งหมดทำงานสมบูรณ์แล้ว');
        console.log('=====================================');
    }
};
