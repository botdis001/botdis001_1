const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 1. จัดการกรณีที่เป็น Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการรันคำสั่ง', ephemeral: true });
                }
            }
            return;
        }

        // 2. จัดการกรณีที่มีการกดปุ่ม (Button)
        if (interaction.isButton()) {
            console.log(`🔘 มีคนกดปุ่ม Custom ID: "${interaction.customId}"`);

            // 2.1 ระบบแจกยศเดิม (role_toggle_)
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
                return;
            }

            // 2.2 รองรับปุ่มลงทะเบียน modal_role_trigger ของคุณ
            if (interaction.customId === 'modal_role_trigger') {
                try {
                    const modal = new ModalBuilder()
                        .setCustomId('register_modal')
                        .setTitle('ลงทะเบียน / ตั้งชื่อและรับยศ');

                    const steamInput = new TextInputBuilder()
                        .setCustomId('steam_id_input')
                        .setLabel('กรอก Steam ID64 (17 หลัก)')
                        .setPlaceholder('ตัวอย่าง: 7656119XXXXXXXXXX')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const row = new ActionRowBuilder().addComponents(steamInput);
                    modal.addComponents(row);

                    await interaction.showModal(modal);
                } catch (error) {
                    console.error('❌ Error showing modal:', error);
                }
                return;
            }
        }

        // 3. จัดการตอนกดยืนยันข้อมูลใน Modal (ช่องกรอก Steam ID)
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'register_modal') {
                const steamId = interaction.fields.getTextInputValue('steam_id_input');
                
                await interaction.reply({ 
                    content: `✅ บันทึก Steam ID: \`${steamId}\` เรียบร้อยแล้ว! ระบบกำลังตรวจสอบข้อมูล...`, 
                    ephemeral: true 
                });
                return;
            }
        }
    },
};
