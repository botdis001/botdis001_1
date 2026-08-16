```js
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);

        const ROLE_CHANNEL_ID = '1486030638464237631';

        try {
            const channel = await client.channels.fetch(ROLE_CHANNEL_ID);

            if (!channel) {
                console.error(
                    `❌ ไม่พบห้องลงทะเบียน ID: ${ROLE_CHANNEL_ID}`
                );
                return;
            }

            // ==========================================
            // 🗑️ ลบข้อความเก่า
            // ==========================================

            try {
                const fetchedMessages = await channel.messages.fetch({
                    limit: 20
                });

                if (fetchedMessages.size > 0) {
                    await channel.bulkDelete(
                        fetchedMessages
                    ).catch(async () => {
                        for (const msg of fetchedMessages.values()) {
                            await msg.delete().catch(() => {});
                        }
                    });

                    console.log(
                        `🗑️ ลบข้อความเก่า ${fetchedMessages.size} ข้อความ`
                    );
                }
            } catch (error) {
                console.error(
                    '❌ ไม่สามารถลบข้อความเก่าได้:',
                    error.message
                );
            }

            // ==========================================
            // 🎨 Embed
            // ==========================================

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(
                    `✨ ยินดีต้อนรับสู่ ${channel.guild.name}`
                )
                .setDescription(
                    'ยินดีต้อนรับสมาชิกใหม่ทุกท่านเข้าสู่เซิร์ฟเวอร์ของเราครับ!\n\n' +

                    '📋 **ขั้นตอนการลงทะเบียน & รับยศเกม:**\n\n' +

                    '1️⃣ กดปุ่ม **"ลงทะเบียน / ตั้งชื่อและรับยศ"** ด้านล่าง\n\n' +

                    '2️⃣ กรอก **ชื่อที่ต้องการใช้ในเซิร์ฟเวอร์**\n\n' +

                    '3️⃣ กรอก **Steam ID64 จำนวน 17 หลัก**\n\n' +

                    '4️⃣ ระบบจะตรวจสอบ Steam และสถานะ **VAC** อัตโนมัติ\n\n' +

                    '5️⃣ เลือก **เกมที่ต้องการรับยศ**\n\n' +

                    '6️⃣ ระบบจะเปลี่ยนชื่อและมอบยศของเกมที่เลือกให้โดยอัตโนมัติ\n\n' +

                    '📌 **ตัวอย่าง Steam ID64**\n' +
                    '`7656119XXXXXXXXXX`\n\n' +

                    '⚠️ **หมายเหตุ:**\n' +
                    'กรุณากรอก Steam ID64 ให้ถูกต้อง และใช้ชื่อที่สุภาพและเหมาะสมกับชุมชน'
                )
                .setThumbnail(
                    channel.guild.iconURL({
                        dynamic: true
                    })
                )
                .addFields(
                    {
                        name: '🔒 ความปลอดภัย',
                        value:
                            'ระบบตรวจสอบ Steam และ VAC อัตโนมัติ',
                        inline: true
                    },
                    {
                        name: '🎮 เลือกเกม',
                        value:
                            'เลือกเกมเพื่อรับยศที่ตรงกับเกม',
                        inline: true
                    },
                    {
                        name: '💎 สิทธิพิเศษ',
                        value:
                            'รับยศเกมเพื่อปลดล็อกห้องที่เกี่ยวข้อง',
                        inline: true
                    }
                )
                .setFooter({
                    text:
                        `${channel.guild.name} • ระบบจัดการสมาชิกอัตโนมัติ`,
                    iconURL:
                        client.user.displayAvatarURL()
                })
                .setTimestamp();

            // ==========================================
            // 🔘 ปุ่ม
            // ==========================================

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            'modal_role_trigger'
                        )
                        .setLabel(
                            'ลงทะเบียน / ตั้งชื่อและรับยศ'
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                        .setEmoji('🎉')
                );

            // ==========================================
            // 📤 ส่ง
            // ==========================================

            await channel.send({
                embeds: [embed],
                components: [button]
            });

            console.log('=====================================');
            console.log('✅ ระบบลงทะเบียนพร้อมใช้งาน');
            console.log(
                `📌 ห้องลงทะเบียน: ${ROLE_CHANNEL_ID}`
            );
            console.log(
                '🎮 ระบบเลือกเกมและรับยศพร้อมใช้งาน'
            );
            console.log(
                '🛡️ ระบบตรวจ Steam / VAC พร้อมใช้งาน'
            );
            console.log('=====================================');

        } catch (error) {
            console.error(
                '❌ เกิดข้อผิดพลาดตอนสร้างระบบลงทะเบียน:',
                error
            );
        }
    }
};
```
