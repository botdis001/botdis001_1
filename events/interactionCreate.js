module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // เช็กว่าเป็นปุ่มกดหรือไม่
        if (!interaction.isButton()) return;
        
        // เช็กว่าเป็นปุ่มรับยศที่เราต้องการไหม
        if (!interaction.customId.startsWith('role_toggle_')) return;

        const roleId = interaction.customId.split('_')[2];
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(roleId);

        // ID ห้องสำหรับส่ง Log
        const LOG_CHANNEL_ID = '1494379391327928370';

        // ฟังก์ชันดึงเวลาปัจจุบันรูปแบบไทย
        const getTime = () => new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        if (!role) {
            return interaction.reply({ 
                content: '❌ ไม่พบยศนี้ในระบบเซิร์ฟเวอร์', 
                ephemeral: true 
            });
        }

        try {
            const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

            if (member.roles.cache.has(roleId)) {
                // ถ้ามีอยู่แล้ว ให้ถอดออก
                await member.roles.remove(roleId);
                await interaction.reply({ 
                    content: `✅ ถอดยศ **${role.name}** ออกจากคุณเรียบร้อยแล้วครับ`, 
                    ephemeral: true 
                });

                // ส่ง Log รูปแบบ Markdown
                if (logChannel) {
                    await logChannel.send(`\`\`\`md
# 🔴 ถอดยศสมาชิก
- ชื่อ: ${member.user.tag}
- ยศ: ${role.name}
- เวลา: ${getTime()}
\`\`\``);
                }
            } else {
                // ถ้ายังไม่มี ให้เพิ่มยศ
                await member.roles.add(roleId);
                await interaction.reply({ 
                    content: `🎉 รับยศ **${role.name}** เรียบร้อยแล้วครับ!`, 
                    ephemeral: true 
                });

                // ส่ง Log รูปแบบ Markdown
                if (logChannel) {
                    await logChannel.send(`\`\`\`md
# 🟢 รับยศสมาชิก
- ชื่อ: ${member.user.tag}
- ยศ: ${role.name}
- เวลา: ${getTime()}
\`\`\``);
                }
            }
        } catch (error) {
            console.error('Error handling role button:', error);
            await interaction.reply({ 
                content: '❌ เกิดข้อผิดพลาด: บอทอาจไม่มีสิทธิ์จัดการยศนี้ หรือตำแหน่งยศบอทอยู่ต่ำกว่ายศเป้าหมาย', 
                ephemeral: true 
            });
        }
    }
};
