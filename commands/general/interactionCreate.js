const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // เช็กว่าเป็นเหตุการณ์การกดปุ่ม (Button) หรือไม่
        if (!interaction.isButton()) return;

        // เช็กว่าปุ่มนี้คือปุ่มรับยศที่เราสร้างไว้หรือไม่ (เช็กจาก customId)
        if (interaction.customId.startsWith('role_toggle_')) {
            const roleId = interaction.customId.split('_')[2];
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) return interaction.reply({ content: '❌ ไม่พบยศนี้ในเซิร์ฟเวอร์', ephemeral: true });

            try {
                if (member.roles.cache.has(roleId)) {
                    // ถ้ามีอยู่แล้ว ให้ลบออก
                    await member.roles.remove(roleId);
                    await interaction.reply({ content: `✅ ถอดยศ **${role.name}** ออกเรียบร้อยแล้วครับ`, ephemeral: true });
                } else {
                    // ถ้ายังไม่มี ให้เพิ่มยศ
                    await member.roles.add(roleId);
                    await interaction.reply({ content: `🎉 รับยศ **${role.name}** เรียบร้อยแล้วครับ!`, ephemeral: true });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการจัดการยศ', ephemeral: true });
            }
        }
    },
};
