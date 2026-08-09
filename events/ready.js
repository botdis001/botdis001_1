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

                // สร้าง Embed และปุ่มใหม่ (Custom ID ใหม่)
                const embed = new EmbedBuilder()
                    .setTitle('ยินดีต้อนรับสู่ ' + channel.guild.name)
                    .setDescription('กดปุ่มด้านล่างเพื่อกรอกชื่อและรับยศ **friend** ครับ')
                    .setColor('#0099ff')
                    .setThumbnail(channel.guild.iconURL())
                    .setFooter({ text: 'ระบบจัดการยศและเปลี่ยนชื่ออัตโนมัติ' });

                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('modal_role_trigger') // ตัวนี้คือตัวเรียกฟอร์ม
                            .setLabel('กรอกชื่อและรับยศ!')
                            .setStyle(ButtonStyle.Primary),
                    );

                await channel.send({ embeds: [embed], components: [button] });
                console.log('✅ ลบข้อความเก่าและสร้างปุ่มใหม่ (Modal) สำเร็จ!');
            }
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดตอนสร้างปุ่ม:', err.message);
        }
    }
};
