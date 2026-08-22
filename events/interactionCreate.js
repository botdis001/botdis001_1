const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

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

        // 2. จัดการกรณีที่เป็น Button Interaction (กดปุ่ม)
        if (interaction.isButton()) {
            console.log(`🔘 มีคนกดปุ่ม Custom ID: "${interaction.customId}"`);

            // 2.1 ระบบแจกยศเดิมของคุณ (role_toggle_)
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

            // 2.2 รองรับปุ่มลงทะเบียน (เปลี่ยน 'register_button' เป็น Custom ID จริงของปุ่มคุณ ถ้าไม่ใช่ชื่อนี้)
            if (interaction.customId === 'register_button' || interaction.customId.includes('register')) {
                // ตัวอย่าง: เด้ง Modal ขึ้นมาให้กรอก Steam ID
                const modal = new ModalBuilder()
                    .setCustomId('register_modal')
                    .setTitle('ลงทะเบียน / ตั้งชื่อและรับยศ');

                const steamInput = new TextInputBuilder()
                    .setCustomId('steam_id_input')
                    .setLabel('กรอก Steam ID64 (17 หลัก)')
                    .setPlaceholder('ตัวอย่าง: 7656119XXXXXXXXXX')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const firstRow = new ActionRowBuilder().addComponents(steamInput);
                modal.addComponents(firstRow);

                await interaction.showModal(modal);
                return;
            }
        }

        // 3. จัดการกรณีที่กดยืนยันใน Modal (ช่องกรอกข้อมูล)
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
