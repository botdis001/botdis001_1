// --- 1. ระบบลงทะเบียน ---
        const ROLE_CHANNEL_ID = '1486030638464237631';
        try {
            const channel = await client.channels.fetch(ROLE_CHANNEL_ID);
            if (channel) {
                // ลบข้อความเก่าของบอททิ้งก่อน เพื่อให้ส่งใหม่ชัวร์ๆ
                const messages = await channel.messages.fetch({ limit: 10 });
                const botMessages = messages.filter(msg => msg.author.id === client.user.id);
                for (const msg of botMessages.values()) {
                    await msg.delete().catch(() => {});
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
                console.log('✅ ระบบลงทะเบียนพร้อมใช้งาน');
            }
        } catch (error) {
            console.error('❌ Error ระบบลงทะเบียน:', error);
        }
