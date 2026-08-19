module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
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
    }
};
