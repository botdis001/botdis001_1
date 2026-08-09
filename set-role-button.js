const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-role-button')
        .setDescription('วางปุ่มรับ/ถอดยศ ในห้องรับยศ')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // เฉพาะแอดมินใช้ได้
        
    async execute(interaction) {
        // 📌 แก้ไขเป็นไอดีใหม่ของคุณเรียบร้อยแล้วครับ
        const ROLE_ID = '1486030638464237631'; 

        // 1. ดีไซน์การ์ด Embed แสดงรายละเอียด
        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // สีเขียวมรกต
            .setTitle('🎮 เลือกรับยศของคุณที่นี่!')
            .setDescription('กดปุ่มสีเขียวด้านล่างนี้เพื่อรับยศหรือถอดยศเข้ากลุ่มได้เลยครับ')
            .setFooter({ text: 'GAME Group • ระบบจัดการยศอัตโนมัติ' })
            .setTimestamp();

        // 2. สร้างปุ่มกดที่ผูกกับไอดีใหม่
        const roleButton = new ButtonBuilder()
            .setCustomId(`role_toggle_${ROLE_ID}`) 
            .setLabel('รับยศ / คืนยศ Member')
            .setStyle(ButtonStyle.Success) // ปุ่มสีเขียว
            .setEmoji('🎉');

        const row = new ActionRowBuilder().addComponents(roleButton);

        // 3. ส่งการ์ดพร้อมปุ่มออกไปในห้องแชท
        await interaction.reply({ embeds: [embed], components: [row] });
    },
};