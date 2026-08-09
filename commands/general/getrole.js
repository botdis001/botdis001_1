module.exports = {
    name: 'getrole',
    async execute(message) {
        // ป้องกันไม่ให้บอทคุยกับตัวเองหรือข้อความที่ไม่ใช่กิลด์
        if (!message.guild || message.author.bot) return;

        const prefix = '!';
        if (!message.content.startsWith(`${prefix}getrole`)) return;

        // ไอดีของยศ Member ที่ต้องการแจก
        const ROLE_ID = '1356148472851726437';
        const role = message.guild.roles.cache.get(ROLE_ID);

        if (!role) {
            return message.reply('❌ ไม่พบยศนี้ในระบบ กรุณาตรวจสอบไอดีใหม่อีกครั้ง');
        }

        try {
            const member = message.member;

            if (member.roles.cache.has(ROLE_ID)) {
                // ถ้ามีอยู่แล้ว ให้ถอดออก
                await member.roles.remove(ROLE_ID);
                await message.reply(`✅ ถอดยศ **${role.name}** ออกจากคุณเรียบร้อยแล้วครับ`);
            } else {
                // ถ้ายังไม่มี ให้เพิ่มยศ
                await member.roles.add(ROLE_ID);
                await message.reply(`🎉 รับยศ **${role.name}** เรียบร้อยแล้วครับ!`);
            }
        } catch (error) {
            console.error(error);
            await message.reply('❌ เกิดข้อผิดพลาด (บอทอาจจะไม่มีสิทธิ์จัดการยศนี้ หรือตำแหน่งยศบอทอยู่ต่ำกว่ายศนี้)');
        }
    }
};
