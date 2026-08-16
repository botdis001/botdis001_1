# `events/ready.js`

```js
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);

        // ==========================================
        // ⚙️ ตั้งค่าห้องลงทะเบียน
        // ==========================================

        const ROLE_CHANNEL_ID = '1486030638464237631';

        try {
            // ==========================================
            // 📌 ดึงห้องลงทะเบียน
            // ==========================================

            const channel = await client.channels.fetch(
                ROLE_CHANNEL_ID
            );

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
                const fetchedMessages =
                    await channel.messages.fetch({
                        limit: 20
                    });

                if (fetchedMessages.size > 0) {

                    await channel.bulkDelete(
                        fetchedMessages
                    ).catch(async () => {

                        for (
                            const msg
                            of fetchedMessages.values()
                        ) {
                            await msg.delete().catch(() => {});
                        }

                    });

                    console.log(
                        `🗑️ ลบข้อความเก่า ${fetchedMessages.size} ข้อความ`
                    );
                }

            } catch (deleteError) {

                console.error(
                    '❌ ไม่สามารถลบข้อความเก่าได้:',
                    deleteError.message
                );
            }

            // ==========================================
            // 🎨 Embed ระบบลงทะเบียน
            // ==========================================

            const embed = new EmbedBuilder()
                .setColor('#5865F2')

                .setTitle(
                    `✨ ยินดีต้อนรับสู่ ${channel.guild.name}`
                )

                .setDescription(
                    'ยินดีต้อนรับสมาชิกใหม่ทุกท่านเข้าสู่เซิร์ฟเวอร์ของเราครับ!\n\n' +

                    '📋 **ขั้นตอนการยืนยันตัวตน & รับยศ:**\n\n' +

                    '1️⃣ กดปุ่ม **"ลงทะเบียน / ตั้งชื่อและรับยศ"** ด้านล่าง\n\n' +

                    '2️⃣ กรอก **ชื่อที่ต้องการใช้ในเซิร์ฟเวอร์**\n\n' +

                    '3️⃣ กรอก **Steam ID64 จำนวน 17 หลัก**\n\n' +

                    '4️⃣ ระบบจะตรวจสอบข้อมูล Steam และสถานะ **VAC** อัตโนมัติ\n\n' +

                    '5️⃣ หากข้อมูลถูกต้อง ระบบจะเปลี่ยนชื่อและมอบยศ **friend** ให้โดยอัตโนมัติ\n\n' +

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
                        name: '💎 สิทธิพิเศษ',
                        value:
                            'รับยศ **friend** เพื่อปลดล็อกห้องพูดคุย',
                        inline: true
                    },
                    {
                        name: '🎮 Steam',
                        value:
                            'ต้องใช้ Steam ID64 จำนวน 17 หลัก',
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
            // 🔘 ปุ่มลงทะเบียน
            // ==========================================

            const button =
                new ActionRowBuilder()
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
            // 📤 ส่ง Embed + ปุ่ม
            // ==========================================

            await channel.send({
                embeds: [embed],
                components: [button]
            });

            console.log(
                '====================================='
            );

            console.log(
                '✅ ระบบลงทะเบียนพร้อมใช้งาน'
            );

            console.log(
                `📌 ห้องลงทะเบียน: ${ROLE_CHANNEL_ID}`
            );

            console.log(
                '🎮 รองรับ Steam ID64 + ตรวจ VAC'
            );

            console.log(
                '====================================='
            );

        } catch (err) {

            console.error(
                '❌ เกิดข้อผิดพลาดตอนสร้างระบบลงทะเบียน:',
                err
            );
        }
    }
};
```

### การทำงานหลังจากแก้

`ready.js` ตัวนี้จะทำหน้าที่แค่:

**บอทออนไลน์ → ลบข้อความเก่า → สร้าง Embed → สร้างปุ่ม**

เมื่อสมาชิกกดปุ่ม `modal_role_trigger` จะส่งต่อให้ `interactionCreate.js` ที่คุณเปลี่ยนเป็นตัวตรวจ Steam/VAC

ดังนั้น **ไม่ต้องใส่ Steam API Key ใน ****`ready.js`**

ใน Railway ให้มีเพียง:

```text
STEAM_API_KEY=Steam_Web_API_Key_ของคุณ
```

และห้อง Log VAC/ลงทะเบียนยังเป็น:

```text
1538429606409928815
```

ส่วนห้องปุ่มลงทะเบียนยังเป็น:

```text
1486030638464237631
```

**อย่าลืม:** ระบบตรวจ VAC ที่เราทำใช้ **SteamID64 17 หลัก** ไม่ใช่ Steam ID 13 หลัก
