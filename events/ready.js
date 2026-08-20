const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const WEATHER_CHANNEL_ID = '1538500010172223558';
const GEO_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log(`🚀 บอทออนไลน์: ${client.user.tag}`);

        // โค้ดทั้งหมดต้องอยู่ภายใน execute และใช้ await อยู่ข้างในนี้ได้ปกติ
        try {
            const response = await fetch(GEO_URL);
            // ... โค้ดที่เหลือทั้งหมด ...
        } catch (error) {
            console.error('Error:', error);
        }
    }
};
