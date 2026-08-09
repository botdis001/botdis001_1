module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ บอทออนไลน์แล้ว: ${client.user.tag}`);
    }
};