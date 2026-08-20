const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // บรรทัดนี้จะช่วยปริ้นท์ชื่อปุ่มที่ถูกกดโชว์ใน Console ของ Railway ทันทีที่คุณกด
        console.log(`🔘 มีคนกดปุ่ม Custom ID: "${interaction.customId}"`);

        // ถ้าปุ่มขึ้นต้นด้วย role_toggle_ ให้ทำงานแจกยศ
        if (interaction.customId.startsWith('role_toggle_')) {
            await interaction.deferReply({ ephemeral: true });

            const roleId = interaction.customId.split('_')[2];
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return await interaction.editReply({ content: '❌ ไม่พบยศนี้ในเซิร์ฟเวอร์' });
            }

            try {
                if (member.roles.cache.has(roleId)) {
                    await member.roles.remove(roleId);
                    await interaction.editReply({ content: `✅ ถอดยศ **${role.name}** ออกเรียบร้อยแล้วครับ` });
                } else {
                    await member.roles.add(roleId);
                    await interaction.editReply({ content: `🎉 รับยศ **${role.name}** เรียบร้อยแล้วครับ!` });
                }
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการจัดการยศ' });
            }
        }
    },
};
