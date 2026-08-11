const { SlashCommandBuilder } = require('discord.js');
const youtubeNotifier = require('../events/youtubeNotifier'); // ดึงค่าจากไฟล์ notifier

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addyoutube')
        .setDescription('เพิ่มช่อง YouTube สำหรับให้บอทติดตามแจ้งเตือน')
        .addStringOption(option =>
            option.setName('channel_id')
                .setDescription('Channel ID ของยูทูป (ขึ้นต้นด้วย UC...)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('ชื่อช่องที่จะให้แสดงในข้อความแจ้งเตือน')
                .setRequired(true)),

    async execute(interaction) {
        // เช็กสิทธิ์แอดมิน
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
        }

        const channelId = interaction.options.getString('channel_id');
        const channelName = interaction.options.getString('name');

        if (!channelId.startsWith('UC')) {
            return await interaction.reply({ content: '❌ Channel ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย UC...)', ephemeral: true });
        }

        // ดึง channelsToTrack จากไฟล์ youtubeNotifier
        const channels = youtubeNotifier.channelsToTrack;
        const exists = channels.find(c => c.id === channelId);

        if (exists) {
            return await interaction.reply({ content: `⚠️ ช่อง **${exists.name}** มีอยู่ในระบบติดตามอยู่แล้วครับ!`, ephemeral: true });
        }

        // เพิ่มช่องใหม่
        channels.push({ id: channelId, name: channelName });

        await interaction.reply({ 
            content: `✅ **เพิ่มช่อง YouTube สำเร็จ!**\n- ชื่อช่อง: ${channelName}\n- Channel ID: \`${channelId}\``, 
            ephemeral: false 
        });
        
        console.log(`➕ แอดมิน ${interaction.user.tag} เพิ่มช่อง: ${channelName}`);
    }
};
