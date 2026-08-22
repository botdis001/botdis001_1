const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 1. จัดการกรณีที่เป็น Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ ไม่พบคำสั่งที่ตรงกับชื่อ: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ เกิดข้อผิดพลาดขณะรันคำสั่ง ${interaction.commandName}:`, error);
                const errorMessage = { content: '❌ เกิดข้อผิดพลาดบางประการขณะรันคำสั่งนี้!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return;
        }

        // 2. จัดการกรณีที่เป็น Button Interaction (ระบบกดรับยศ)
        if (interaction.isButton()) {
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
                    await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการจัดการยศ (บอทอาจจะยศต่ำกว่ายศที่จะให้)' });
                }
            }
            return;
        }
    },
};
