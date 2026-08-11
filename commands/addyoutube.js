const { SlashCommandBuilder } = require('discord.js');
const youtubeNotifier = require('../events/youtubeNotifier');

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
        // จัดการดีเลย์ป้องกัน Discord ขึ้นแอปพลิเคชันไม่ตอบสนอง
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้ (ต้องเป็นแอดมินเท่านั้น)' });
        }

        const channelId = interaction.options.getString('channel_id');
        const channelName = interaction.options.getString('name');

        if (!channelId.startsWith('UC')) {
            return await interaction.editReply({ content: '❌ Channel ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย UC...)' });
        }

        const channels = youtubeNotifier.channelsToTrack;
        const exists = channels.find(c => c.id === channelId);

        if (exists) {
            return await interaction.editReply({ content: `⚠️ ช่อง **${exists.name}** มีอยู่ในระบบติดตามอยู่แล้วครับ!` });
        }

        channels.push({ id: channelId, name: channelName });

        await interaction.editReply({ 
            content: `✅ **เพิ่มช่อง YouTube สำเร็จ!**\n- ชื่อช่อง: ${channelName}\n- Channel ID: \`${channelId}\`` 
        });
        
        console.log(`➕ แอดมิน ${interaction.user.tag} ได้เพิ่มช่อง YouTube ใหม่: ${channelName} (${channelId})`);
    }
};
