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
                console.error(`❌ ไม่พบห้องลงทะเบียน: ${ROLE_CHANNEL_ID}`);
                return;
            }

            // ลบข้อความเก่า
            try {
                const messages = await channel.messages.fetch({
                    limit: 20
                });

                if (messages.size > 0) {
                    await channel.bulkDelete(messages).catch(async () => {
                        for (const message of messages.values()) {
                            await message.delete().catch(() => {});
                        }
                    });

                    console.log(`🗑️ ลบข้อความเก่า ${messages.size} ข้อความ`);
                }
            } catch (error) {
                console.error(
                    '❌ ลบข้อความเก่าไม่ได้:',
                    error.message
                );
            }

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
                .setThumbnail(
                    channel.guild.iconURL({
                        dynamic: true
                    })
                )
                .addFields(
                    {
                        name: '🔒 ความปลอดภัย',
                        value: 'ตรวจสอบ Steam และ VAC อัตโนมัติ',
                        inline: true
                    },
                    {
                        name: '🎮 เลือกเกม',
                        value: 'เลือกเกมเพื่อรับยศ',
                        inline: true
                    },
                    {
                        name: '💎 สิทธิพิเศษ',
                        value: 'รับยศเกมที่เลือก',
                        inline: true
                    }
                )
                .setFooter({
                    text: `${channel.guild.name} • ระบบจัดการสมาชิกอัตโนมัติ`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('modal_role_trigger')
                        .setLabel('ลงทะเบียน / ตั้งชื่อและรับยศ')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎉')
                );

            await channel.send({
                embeds: [embed],
                components: [button]
            });

            console.log('=====================================');
            console.log('✅ ระบบลงทะเบียนพร้อมใช้งาน');
            console.log(`📌 ห้องลงทะเบียน: ${ROLE_CHANNEL_ID}`);
            console.log('🎮 ระบบเลือกเกมพร้อมใช้งาน');
            console.log('🛡️ ระบบ Steam / VAC พร้อมใช้งาน');
            console.log('=====================================');

        } catch (error) {
            console.error(
                '❌ เกิดข้อผิดพลาดใน ready.js:',
                error
            );
        }
    }
};
