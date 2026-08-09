const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-role')
        .setDescription('สร้างปุ่มสำหรับกดรับยศอัตโนมัติ')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // 📌 เปลี่ยนตัวเลขด้านล่างนี้ให้เป็นไอดีของยศ Member จริงในดิสคอร์ดของพี่เบิร์ดนะครับ
        const ROLE_ID = '1483918700976410694'; 

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🎮 เลือกรับยศของคุณที่นี่!')
            .setDescription('กดปุ่มด้านล่างนี้เพื่อรับยศหรือถอดยศเข้ากลุ่มได้เลยครับ')
            .setFooter({ text: 'GAME Group • ระบบจัดการยศอัตโนมัติ' })
            .setTimestamp();

        const roleButton = new ButtonBuilder()
            .setCustomId(`role_toggle_${ROLE_ID}`)
            .setLabel('รับยศ / คืนยศ Member')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎉');

        const row = new ActionRowBuilder().addComponents(roleButton);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};