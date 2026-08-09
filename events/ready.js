const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('=====================================');
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);
        console.log('=====================================');

        // ID ห้องสำหรับส่งปุ่มรับยศ
        const ROLE_CHANNEL_ID = '1486030638464237631'; 
        const ROLE_ID = '1356148472851726437'; // ID ยศ Regular

        try {
            const channel = client.channels.cache.get(ROLE_CHANNEL_ID) || await client.channels.fetch(ROLE_CHANNEL_ID);
            
            if (channel) {
                // 1. ลบข้อความเก่าในห้องนั้นทิ้งให้หมดเพื่อป้องกันปุ่มค้าง
                const messages = await channel.messages.fetch({ limit: 10 });
                await channel.bulkDelete(messages).catch(() => {});

                // 2. สร้าง Embed พร้อมโลโก้เซิร์ฟเวอร์
                const embed = new EmbedBuilder()
                    .setTitle('ยินดีต้อนรับสู่ ' + channel.guild.name)
                    .setDescription('กดปุ่มด้านล่างเพื่อรับยศ **friend** และเข้าสู่เซิร์ฟเวอร์ครับ')
                    .setColor('#0099ff')
                    .setThumbnail(channel.guild.iconURL())
                    .setFooter({ text: 'ระบบจัดการยศอัตโนมัติ' });

                // 3. สร้างปุ่ม
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`role_toggle_${ROLE_ID}`)
                            .setLabel('กดรับยศ!')
                            .setStyle(ButtonStyle.Primary),
                    );

                // 4. ส่งปุ่มใหม่เข้าไปในห้อง
                await channel.send({ embeds: [embed], components: [button] });
                console.log('✅ สร้างปุ่มรับยศเรียบร้อยแล้ว');
            } else {
                console.log('❌ ไม่พบห้องสำหรับสร้างปุ่มรับยศ');
            }
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดในการสร้างปุ่ม:', err.message);
        }
    }
};
