const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // ตรวจสอบว่าเป็นปุ่มที่เราต้องการจัดการหรือไม่
        if (!interaction.isButton()) return;

        if (interaction.customId === 'weather_my_location') {
            try {
                // 1. แจ้ง Discord ทันทีว่าบอทรับคำสั่งแล้ว เพื่อป้องกันขึ้นแถบสีแดง "น้องบอทไม่ตอบสนองในเวลาที่กำหนด"
                await interaction.deferReply({ ephemeral: true });

                // 2. สร้างลิงก์เว็บไซต์พร้อมแนบ userId ของผู้กดไปด้วย
                const webUrl = `https://${process.env.RAILWAY_STATIC_URL || 'ชื่อเว็บของคุณบนRailway'}/?userId=${interaction.user.id}`;
                // หมายเหตุ: ถ้าบน Railway คุณไม่ได้ตั้งค่าตัวแปร STATIC_URL ให้ใส่ URL เต็มๆ ของเว็บรันบน Railway แทนได้เลยครับ 
                // เช่น const webUrl = `https://botdis0011-production-c580.up.railway.app/?userId=${interaction.user.id}`;

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('📍 เปิดเว็บเพื่อเช็กพิกัดสภาพอากาศ')
                        .setStyle(ButtonStyle.Link)
                        .setURL(webUrl)
                );

                // 3. ส่งข้อความแบบเห็นเฉพาะตัวผู้ใช้ (Ephemeral) กลับไปพร้อมปุ่มลิงก์
                await interaction.editReply({
                    content: 'กรุณาคลิกที่ลิงก์ส่วนตัวด้านล่างเพื่อตรวจสอบสภาพอากาศของคุณ:',
                    components: [row]
                });

            } catch (error) {
                console.error('Weather Interaction Error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ เกิดข้อผิดพลาดบางประการ กรุณาลองใหม่อีกครั้ง', ephemeral: true }).catch(() => {});
                }
            }
        }
    }
};
