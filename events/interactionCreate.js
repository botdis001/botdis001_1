module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // จัดการกรณีผู้ใช้กำลังพิมพ์ค้นหา (Autocomplete)
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error('Error handling autocomplete:', error);
            }
            return;
        }

        // จัดการกรณีผู้ใช้ส่งคำสั่ง Slash Command (/weather)
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                
                const errorMessage = { 
                    content: '❌ เกิดข้อผิดพลาดบางประการในการรันคำสั่งนี้ กรุณาลองใหม่อีกครั้ง', 
                    ephemeral: true 
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => {});
                } else {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            }
            return;
        }

        // ถ้ามีการใช้ปุ่ม (Button) หรือเมนูอื่นๆ เพิ่มเติมในอนาคต สามารถเขียนดักจับต่อตรงนี้ได้ครับ
    }
};
