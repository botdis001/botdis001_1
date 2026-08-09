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

        // 🔍 DEBUG: ตรวจสอบว่ามี Interaction อะไรเข้ามา
        if (interaction.isButton()) {
            console.log(`[DEBUG] มีคนกดปุ่ม Custom ID: ${interaction.customId}`);
        }

        // 1. กดปุ่มเพื่อเปิดฟอร์มกรอกชื่อ
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

            console.log(`[DEBUG] กำลังเปิด Modal ให้ผู้ใช้: ${interaction.user.tag}`);
            return await interaction.showModal(modal);
        }

        // 2. เมื่อผู้ใช้กดยืนยันส่งข้อมูลจากป๊อปอัป
        if (interaction.isModalSubmit() && interaction.customId === 'role_nickname_modal') {
            const newNickname = interaction.fields.getTextInputValue('nickname_input');
            const member = interaction.member;
            const role = interaction.guild.roles.cache.get(ROLE_ID);

            console.log(`[DEBUG] ผู้ใช้ ${member.user.tag} ส่งชื่อมาว่า: ${newNickname}`);

            if (!role) {
                console.log(`[DEBUG] ❌ ไม่พบยศ ID: ${ROLE_ID} ในเซิร์ฟเวอร์`);
                return interaction.reply({ 
                    content: '❌ ไม่พบยศในระบบ กรุณาแจ้งแอดมิน', 
                    ephemeral: true 
                });
            }

            try {
                // เปลี่ยนชื่อเล่น
                await member.setNickname(newNickname);
                console.log(`[DEBUG] ✅ เปลี่ยนชื่อให้ ${member.user.tag} เป็น ${newNickname} สำเร็จ`);

                // เพิ่มยศ
                if (!member.roles.cache.has(ROLE_ID)) {
                    await member.roles.add(ROLE_ID);
                    console.log(`[DEBUG] ✅ เพิ่มยศ ${role.name} สำเร็จ`);
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
                    console.log(`[DEBUG] ✅ ส่ง Log ไปยังห้องสำเร็จ`);
                } else {
                    console.log(`[DEBUG] ❌ ไม่พบห้อง Log ID: ${LOG_CHANNEL_ID}`);
                }
            } catch (error) {
                console.error('[DEBUG] ❌ Error ตอนเปลี่ยนชื่อหรือให้ยศ:', error.message);
                await interaction.reply({ 
                    content: '❌ เกิดข้อผิดพลาด: บอทอาจไม่มีสิทธิ์เปลี่ยนชื่อ (เช่น บอทสถานะต่ำกว่าเจ้าของเซิร์ฟเวอร์)', 
                    ephemeral: true 
                });
            }
        }
    }
};
