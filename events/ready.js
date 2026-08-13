const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);

        const ROLE_CHANNEL_ID = '1486030638464237631'; 

        try {
            const channel = await client.channels.fetch(ROLE_CHANNEL_ID);
            
            if (channel) {
                // ดึงข้อความมาลบทั้งหมดในห้องนี้
                const fetchedMessages = await channel.messages.fetch({ limit: 20 });
                if (fetchedMessages.size > 0) {
                    await channel.bulkDelete(fetchedMessages).catch(async () => {
                        // ถ้า bulk ไม่ได้ ให้ลบทีละข้อความ
                        for (const msg of fetchedMessages.values()) {
                            await msg.delete().catch(() => {});
                        }
                    });
                }

                // ตกแต่งหน้า Embed ให้สวยงามและพรีเมียมยิ่งขึ้น
                const embed = new EmbedBuilder()
                    .setColor('#5865F2') // สีธีม Discord Blurple สวยงามทันสมัย
                    .setTitle(`✨ ยินดีต้อนรับสู่ ${channel.guild.name}`)
                    .setDescription(
                        'ยินดีต้อนรับสมาชิกใหม่ทุกท่านเข้าสู่เซิร์ฟเวอร์ของเราครับ!\n\n' +
                        '📋 **ขั้นตอนการยืนยันตัวตน & รับยศ:**\n' +
                        '1️⃣ กดปุ่ม **"ลงทะเบียนตั้งชื่อ"** ด้านล่างนี้\n' +
                        '2️⃣ กรอกชื่อเล่นที่คุณต้องการใช้ในเซิร์ฟเวอร์\n' +
                        '3️⃣ ระบบจะเปลี่ยนชื่อและให้ยศ **friend** ให้คุณโดยอัตโนมัติทันที!\n\n' +
                        '⚠️ *หมายเหตุ: กรุณาใช้ชื่อที่สุภาพและเหมาะสมเพื่อความสนุกในการร่วมcommunity*'
                    )
                    .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                    .setImage('https://i.imgur.com/your_banner_image_here.png') // (ถ้ามีแบนเนอร์สวยๆ สามารถใส่ลิงก์รูปภาพตรงนี้ได้ หรือลบบรรทัดนี้ออกได้ครับ)
                    .addFields(
                        { name: '🔒 ความปลอดภัย', value: 'ระบบอัตโนมัติ ปลอดภัย 100%', inline: true },
                        { name: '💎 สิทธิพิเศษ', value: 'รับยศ **friend** เพื่อปลดล็อกห้องพูดคุย', inline: true }
                    )
                    .setFooter({ 
                        text: `${channel.guild.name} • ระบบจัดการสมาชิกอัตโนมัติ`, 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                // ตกแต่งปุ่มกดให้ดูโดดเด่น
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('modal_role_trigger') // ตัวเรียกฟอร์ม (ต้องตรงกับ interactionCreate)
                            .setLabel('📝 ลงทะเบียน / ตั้งชื่อและรับยศ')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎉'),
                    );

                await channel.send({ embeds: [embed], components: [button] });
                console.log('✅ ลบข้อความเก่าและสร้างปุ่มใหม่ (Modal แบบตกแต่ง) สำเร็จ!');
            }
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดตอนสร้างปุ่ม:', err.message);
        }
    }
};
