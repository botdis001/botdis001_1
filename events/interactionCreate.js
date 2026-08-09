const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        const LOG_CHANNEL_ID = '1494379391327928370';
        const ROLE_ID = '1356148472851726437'; // ID ยศ friend

        const getTime = () => new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // 1. ตรวจจับปุ่มที่ถูกต้อง (ให้ตรงกับใน ready.js)
        if (interaction.isButton() && interaction.customId === 'modal_role_trigger') {
            const modal = new ModalBuilder()
                .setCustomId('role_nickname_modal')
                .setTitle('ตั้งชื่อและรับยศ');

            const nicknameInput = new TextInputBuilder()
                .setCustomId('nickname_input')
                .setLabel('กรอกชื่อที่คุณต้องการใช้ในเซิร์ฟเวอร์')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('เช่น John_Doe')
                .setRequired(true)
                .setMaxLength(32);

            const firstActionRow = new ActionRowBuilder().addComponents(nicknameInput);
            modal.addComponents(firstActionRow);

            return await interaction.showModal(modal);
        }

        // 2. เมื่อผู้ใช้กดยืนยันส่งข้อมูลจากป๊อปอัป
        if (interaction.isModalSubmit() && interaction.customId === 'role_nickname_modal') {
            const newNickname = interaction.fields.getTextInputValue('nickname_input');
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(ROLE_ID);

            if (!role) {
                return interaction.reply({ 
                    content: '❌ ไม่พบยศในระบบ กรุณาแจ้งแอดมิน', 
                    ephemeral: true 
                });
            }

            try {
                // เปลี่ยนชื่อเล่น
                await member.setNickname(newNickname);

                // เพิ่มยศ
                if (!member.roles.cache.has(ROLE_ID)) {
                    await member.roles.add(ROLE_ID);
                }

                await interaction.reply({ 
                    content: `🎉 เปลี่ยนชื่อเป็น **${newNickname}** และรับยศ **${role.name}** เรียบร้อยแล้วครับ!`, 
                    ephemeral: true 
                });

                // ส่ง Log
                const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
                if (logChannel) {
                    await logChannel.send(`\`\`\`md
# 🟢 สมาชิกรับยศและเปลี่ยนชื่อ
- ชื่อดิสคอร์ด: ${member.user.tag}
- ชื่อใหม่ในเซิร์ฟ: ${newNickname}
- ยศที่ได้รับ: ${role.name}
- เวลา: ${getTime()}
\`\`\``);
                }
            } catch (error) {
                console.error('Error handling modal:', error);
                await interaction.reply({ 
                    content: '❌ เกิดข้อผิดพลาด: บอทอาจไม่มีสิทธิ์เปลี่ยนชื่อ (เช่น บอทสถานะต่ำกว่าเจ้าของเซิร์ฟเวอร์)', 
                    ephemeral: true 
                });
            }
        }
    }
};
