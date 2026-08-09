const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'setupbutton', // ใช้คำสั่ง !setupbutton เพื่อสร้างปุ่ม
    async execute(message) {
        // จำกัดสิทธิ์ให้เฉพาะคุณ (คนสั่ง) ที่ใช้ได้
        if (message.author.id !== 'YOUR_DISCORD_ID') return; // ใส่ ID ของคุณตรงนี้

        const ROLE_ID = '1356148472851726437'; // ID ยศ

        // สร้าง Embed
        const embed = new EmbedBuilder()
            .setTitle('ยินดีต้อนรับสู่ ' + message.guild.name)
            .setDescription('กดปุ่มด้านล่างเพื่อรับยศ **Regular**')
            .setColor('#0099ff')
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: 'ระบบจัดการยศอัตโนมัติ' });

        // สร้างปุ่ม
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`role_toggle_${ROLE_ID}`)
                    .setLabel('กดรับยศ!')
                    .setStyle(ButtonStyle.Primary),
            );

        await message.channel.send({ embeds: [embed], components: [button] });
        await message.reply('✅ สร้างปุ่มเรียบร้อยแล้ว!');
    }
};
