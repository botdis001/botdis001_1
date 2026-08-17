const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'weather_my_location') {
            try {
                // แจ้งรับคำสั่งเพื่อป้องกันแถบสีแดง
                await interaction.deferReply({ ephemeral: true });

                // กำหนด URL ของเว็บไซต์ (ใส่ URL หลักของ Railway โดยเอา /weather.html ออก)
                const webUrl = `https://botdis0011-production-c580.up.railway.app/?userId=${interaction.user.id}`;

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('📍 เปิดเว็บเพื่อเช็กพิกัดสภาพอากาศ')
                        .setStyle(ButtonStyle.Link)
                        .setURL(webUrl)
                );

                await interaction.editReply({
                    content: 'กรุณาคลิกที่ลิงก์ส่วนตัวด้านล่างเพื่อตรวจสอบสภาพอากาศของคุณ:',
                    components: [row]
                });

            } catch (error) {
                console.error('Weather Interaction Error:', error);
            }
        }
    }
};
