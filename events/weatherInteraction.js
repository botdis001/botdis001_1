const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const GEO_URL =
    'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

const WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast';

let geography = null;
let loadingGeography = null;

async function loadGeography() {
    if (geography) return geography;
    if (loadingGeography) return loadingGeography;

    loadingGeography = (async () => {
        const response = await fetch(GEO_URL);
        if (!response.ok) {
            throw new Error(`โหลดข้อมูลพื้นที่ HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('รูปแบบข้อมูลพื้นที่ไม่ถูกต้อง');
        }
        geography = data;
        console.log(`🌍 Weather โหลดข้อมูล ${geography.length} จังหวัดสำเร็จ`);
        return geography;
    })();

    try {
        return await loadingGeography;
    } finally {
        loadingGeography = null;
    }
}

function getWeatherText(code) {
    const weather = {
        0: '☀️ ท้องฟ้าแจ่มใส',
        1: '🌤️ ท้องฟ้าโปร่ง',
        2: '⛅ มีเมฆบางส่วน',
        3: '☁️ มีเมฆมาก',
        45: '🌫️ มีหมอก',
        48: '🌫️ มีหมอก',
        51: '🌦️ ฝนปรอยเล็กน้อย',
        53: '🌦️ ฝนปรอย',
        55: '🌧️ ฝนปรอยหนัก',
        61: '🌧️ ฝนเล็กน้อย',
        63: '🌧️ ฝนปานกลาง',
        65: '🌧️ ฝนตกหนัก',
        80: '🌦️ ฝนตกเป็นช่วง',
        81: '🌧️ ฝนตกเป็นช่วง',
        82: '⛈️ ฝนตกหนักเป็นช่วง',
        95: '⛈️ พายุฝนฟ้าคะนอง',
        96: '⛈️ พายุฝนฟ้าคะนองและลูกเห็บ',
        99: '⛈️ พายุฝนฟ้าคะนองและลูกเห็บหนัก'
    };
    return weather[code] || '🌤️ ไม่ทราบสภาพอากาศ';
}

async function getWeather(latitude, longitude) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current:
            'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
        daily:
            'temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
        timezone: 'Asia/Bangkok',
        forecast_days: '1'
    });

    const response = await fetch(`${WEATHER_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Weather API HTTP ${response.status}`);
    }
    return await response.json();
}

function findProvince(provinceId) {
    if (!geography) return null;
    return geography.find(p => String(p.id) === String(provinceId));
}

function findLocation(provinceId, districtId, subDistrictId) {
    const province = findProvince(provinceId);
    if (!province) return null;

    const district = province.districts.find(d => String(d.id) === String(districtId));
    if (!district) return null;

    const subDistrict = district.sub_districts.find(s => String(s.id) === String(subDistrictId));
    if (!subDistrict) return null;

    return { province, district, subDistrict };
}

function paginate(items, page) {
    const PAGE_SIZE = 25;
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const start = safePage * PAGE_SIZE;

    return {
        items: items.slice(start, start + PAGE_SIZE),
        page: safePage,
        totalPages
    };
}

function provinceComponents(page = 0) {
    const result = paginate(geography, page);

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`weather_province_${result.page}`)
        .setPlaceholder(`🇹🇭 เลือกจังหวัด (หน้า ${result.page + 1}/${result.totalPages})`)
        .addOptions(
            result.items.map(province => ({
                label: province.name_th.slice(0, 100),
                value: String(province.id),
                description: province.name_en ? province.name_en.slice(0, 100) : 'ประเทศไทย'
            }))
        );

    const menuRow = new ActionRowBuilder().addComponents(menu);

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`weather_province_prev_${result.page}`)
            .setLabel('⬅️ ก่อนหน้า')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page <= 0),
        new ButtonBuilder()
            .setCustomId(`weather_province_next_${result.page}`)
            .setLabel('ถัดไป ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page >= result.totalPages - 1)
    );

    return [menuRow, navRow];
}

function districtComponents(province, page = 0) {
    const result = paginate(province.districts, page);

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`weather_district_${province.id}_${result.page}`)
        .setPlaceholder('🏘️ เลือกอำเภอ')
        .addOptions(
            result.items.map(district => ({
                label: district.name_th.slice(0, 100),
                value: String(district.id),
                description: `จ.${province.name_th}`.slice(0, 100)
            }))
        );

    const menuRow = new ActionRowBuilder().addComponents(menu);

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`weather_district_prev_${province.id}_${result.page}`)
            .setLabel('⬅️ ก่อนหน้า')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page <= 0),
        new ButtonBuilder()
            .setCustomId(`weather_district_next_${province.id}_${result.page}`)
            .setLabel('ถัดไป ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page >= result.totalPages - 1)
    );

    return [menuRow, navRow];
}

function subDistrictComponents(province, district, page = 0) {
    const result = paginate(district.sub_districts, page);

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`weather_subdistrict_${province.id}_${district.id}_${result.page}`)
        .setPlaceholder('📍 เลือกตำบล')
        .addOptions(
            result.items.map(subDistrict => ({
                label: subDistrict.name_th.slice(0, 100),
                value: String(subDistrict.id),
                description: `อ.${district.name_th}`.slice(0, 100)
            }))
        );

    const menuRow = new ActionRowBuilder().addComponents(menu);

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`weather_sub_prev_${province.id}_${district.id}_${result.page}`)
            .setLabel('⬅️ ก่อนหน้า')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page <= 0),
        new ButtonBuilder()
            .setCustomId(`weather_sub_next_${province.id}_${district.id}_${result.page}`)
            .setLabel('ถัดไป ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(result.page >= result.totalPages - 1)
    );

    return [menuRow, navRow];
}

function makeWeatherEmbed(locationName, weather) {
    const current = weather.current;
    const daily = weather.daily;
    const weatherText = getWeatherText(current.weather_code);

    return new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🌦️ สภาพอากาศปัจจุบัน')
        .setDescription(`📍 **${locationName}**`)
        .addFields(
            { name: '🌡️ อุณหภูมิ', value: `${current.temperature_2m} °C`, inline: true },
            { name: '🤒 รู้สึกเหมือน', value: `${current.apparent_temperature} °C`, inline: true },
            { name: '💧 ความชื้น', value: `${current.relative_humidity_2m}%`, inline: true },
            { name: '☁️ สภาพอากาศ', value: weatherText, inline: true },
            { name: '💨 ลม', value: `${current.wind_speed_10m} km/h`, inline: true },
            { name: '🌧️ ฝนขณะนี้', value: `${current.precipitation} mm`, inline: true },
            { name: '🌡️ สูงสุดวันนี้', value: `${daily.temperature_2m_max[0]} °C`, inline: true },
            { name: '🌡️ ต่ำสุดวันนี้', value: `${daily.temperature_2m_min[0]} °C`, inline: true },
            { name: '🌧️ โอกาสฝนสูงสุด', value: `${daily.precipitation_probability_max[0]}%`, inline: true },
            { name: '🌅 พระอาทิตย์ขึ้น', value: formatTime(daily.sunrise[0]), inline: true },
            { name: '🌇 พระอาทิตย์ตก', value: formatTime(daily.sunset[0]), inline: true }
        )
        .setFooter({ text: 'ข้อมูลจาก Open-Meteo • เวลาไทย' })
        .setTimestamp();
}

function formatTime(value) {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function refreshButton(customData) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`weather_refresh_${customData}`)
            .setLabel('🔄 อัปเดตสภาพอากาศ')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('weather_choose_again')
            .setLabel('📍 เปลี่ยนพื้นที่')
            .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) {
            return;
        }

        try {
            await loadGeography();
        } catch (error) {
            console.error('❌ Weather Geography:', error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ ระบบข้อมูลพื้นที่ขัดข้อง กรุณาลองใหม่',
                    ephemeral: true
                }).catch(() => {});
            }
            return;
        }

        // ปุ่ม 1: เช็กสภาพอากาศตามตำแหน่ง (เปิด Modal ให้ใส่พิกัด Lat, Long)
        if (interaction.isButton() && interaction.customId === 'weather_my_location') {
            const modal = new ModalBuilder()
                .setCustomId('weather_location_modal')
                .setTitle('📍 เช็กสภาพอากาศตามพิกัด');

            const latInput = new TextInputBuilder()
                .setCustomId('latitude_input')
                .setLabel('ละติจูด (Latitude เช่น 13.7563)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const longInput = new TextInputBuilder()
                .setCustomId('longitude_input')
                .setLabel('ลองจิจูด (Longitude เช่น 100.5018)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(latInput),
                new ActionRowBuilder().addComponents(longInput)
            );

            return await interaction.showModal(modal);
        }

        // รับค่าพิกัดจาก Modal
        if (interaction.isModalSubmit() && interaction.customId === 'weather_location_modal') {
            await interaction.deferReply({ ephemeral: true });

            const lat = Number(interaction.fields.getTextInputValue('latitude_input'));
            const long = Number(interaction.fields.getTextInputValue('longitude_input'));

            if (!Number.isFinite(lat) || !Number.isFinite(long)) {
                return await interaction.editReply({
                    content: '❌ พิกัดละติจูดหรือลองจิจูดไม่ถูกต้อง กรุณาใส่เป็นตัวเลข'
                });
            }

            try {
                const weather = await getWeather(lat, long);
                const embed = makeWeatherEmbed(`พิกัด: (${lat}, ${long})`, weather);
                const buttons = refreshButton(`latlong_${lat}_${long}`);

                await interaction.user.send({
                    content: '🌦️ **รายงานสภาพอากาศตามพิกัดของคุณ**',
                    embeds: [embed],
                    components: [buttons]
                });

                await interaction.editReply({
                    content: '✅ **ส่งข้อมูลสภาพอากาศเข้า DM แล้วครับ!**'
                });
            } catch (err) {
                await interaction.editReply({
                    content: '❌ ไม่สามารถดึงข้อมูลสภาพอากาศจากพิกัดนี้ได้'
                });
            }
            return;
        }

        // ปุ่ม 2: เริ่มเลือกจังหวัด
        if (interaction.isButton() && interaction.customId === 'weather_start') {
            return await interaction.reply({
                content: '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',
                components: provinceComponents(0),
                ephemeral: true
            });
        }

        // หน้าก่อนหน้า จังหวัด
        if (interaction.isButton() && interaction.customId.startsWith('weather_province_prev_')) {
            const page = Number(interaction.customId.split('_')[3]);
            return await interaction.update({
                content: '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',
                components: provinceComponents(page - 1)
            });
        }

        // หน้าถัดไป จังหวัด
        if (interaction.isButton() && interaction.customId.startsWith('weather_province_next_')) {
            const page = Number(interaction.customId.split('_')[3]);
            return await interaction.update({
                content: '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',
                components: provinceComponents(page + 1)
            });
        }

        // เลือกจังหวัด
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('weather_province_')) {
            const provinceId = interaction.values[0];
            const province = findProvince(provinceId);
            if (!province) return await interaction.reply({ content: '❌ ไม่พบจังหวัด', ephemeral: true });

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n\n🏘️ **เลือกอำเภอ**`,
                components: districtComponents(province, 0)
            });
        }

        // หน้าก่อนหน้า อำเภอ
        if (interaction.isButton() && interaction.customId.startsWith('weather_district_prev_')) {
            const parts = interaction.customId.split('_');
            const province = findProvince(parts[3]);
            const page = Number(parts[4]);
            if (!province) return;

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n\n🏘️ **เลือกอำเภอ**`,
                components: districtComponents(province, page - 1)
            });
        }

        // หน้าถัดไป อำเภอ
        if (interaction.isButton() && interaction.customId.startsWith('weather_district_next_')) {
            const parts = interaction.customId.split('_');
            const province = findProvince(parts[3]);
            const page = Number(parts[4]);
            if (!province) return;

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n\n🏘️ **เลือกอำเภอ**`,
                components: districtComponents(province, page + 1)
            });
        }

        // เลือกอำเภอ
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('weather_district_')) {
            const parts = interaction.customId.split('_');
            const province = findProvince(parts[2]);
            const districtId = interaction.values[0];
            if (!province) return await interaction.reply({ content: '❌ ไม่พบจังหวัด', ephemeral: true });

            const district = province.districts.find(d => String(d.id) === String(districtId));
            if (!district) return await interaction.reply({ content: '❌ ไม่พบอำเภอ', ephemeral: true });

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n🏘️ อำเภอ: **${district.name_th}**\n\n📍 **เลือกตำบล**`,
                components: subDistrictComponents(province, district, 0)
            });
        }

        // หน้าก่อนหน้า ตำบล
        if (interaction.isButton() && interaction.customId.startsWith('weather_sub_prev_')) {
            const parts = interaction.customId.split('_');
            const province = findProvince(parts[3]);
            const district = province?.districts.find(d => String(d.id) === String(parts[4]));
            const page = Number(parts[5]);
            if (!district) return;

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n🏘️ อำเภอ: **${district.name_th}**\n\n📍 **เลือกตำบล**`,
                components: subDistrictComponents(province, district, page - 1)
            });
        }

        // หน้าถัดไป ตำบล
        if (interaction.isButton() && interaction.customId.startsWith('weather_sub_next_')) {
            const parts = interaction.customId.split('_');
            const province = findProvince(parts[3]);
            const district = province?.districts.find(d => String(d.id) === String(parts[4]));
            const page = Number(parts[5]);
            if (!district) return;

            return await interaction.update({
                content: `📍 จังหวัด: **${province.name_th}**\n🏘️ อำเภอ: **${district.name_th}**\n\n📍 **เลือกตำบล**`,
                components: subDistrictComponents(province, district, page + 1)
            });
        }

        // เลือกตำบล
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('weather_subdistrict_')) {
            const parts = interaction.customId.split('_');
            const location = findLocation(parts[2], parts[3], interaction.values[0]);
            if (!location) return await interaction.reply({ content: '❌ ไม่พบตำบล', ephemeral: true });

            const lat = Number(location.subDistrict.lat);
            const long = Number(location.subDistrict.long);
            if (!Number.isFinite(lat) || !Number.isFinite(long)) {
                return await interaction.reply({ content: '❌ ตำบลนี้ไม่มีพิกัด', ephemeral: true });
            }

            await interaction.update({
                content: '⏳ **กำลังตรวจสอบสภาพอากาศ...**',
                components: []
            });

            try {
                const weather = await getWeather(lat, long);
                const locationName = `${location.subDistrict.name_th} อ.${location.district.name_th} จ.${location.province.name_th}`;
                const embed = makeWeatherEmbed(locationName, weather);
                const buttons = refreshButton(`${parts[2]}_${parts[3]}_${interaction.values[0]}`);

                await interaction.user.send({
                    content: '🌦️ **รายงานสภาพอากาศของคุณ**',
                    embeds: [embed],
                    components: [buttons]
                });

                await interaction.editReply({
                    content: `✅ **ส่งข้อมูลสภาพอากาศเข้า DM แล้วครับ!**\n📍 ${locationName}`,
                    components: []
                });
            } catch (err) {
                await interaction.editReply({
                    content: '❌ ไม่สามารถดึงข้อมูลสภาพอากาศได้ กรุณาลองใหม่',
                    components: []
                });
            }
            return;
        }

        // ปุ่ม Refresh หรืออัปเดตสภาพอากาศ
        if (interaction.isButton() && interaction.customId.startsWith('weather_refresh_')) {
            const customData = interaction.customId.replace('weather_refresh_', '');
            let lat, long, locationName;

            if (customData.startsWith('latlong_')) {
                const parts = customData.split('_');
                lat = Number(parts[1]);
                long = Number(parts[2]);
                locationName = `พิกัด: (${lat}, ${long})`;
            } else {
                const parts = customData.split('_');
                const location = findLocation(parts[0], parts[1], parts[2]);
                if (!location) return await interaction.reply({ content: '❌ ไม่พบข้อมูลพื้นที่', ephemeral: true });
                lat = Number(location.subDistrict.lat);
                long = Number(location.subDistrict.long);
                locationName = `${location.subDistrict.name_th} อ.${location.district.name_th} จ.${location.province.name_th}`;
            }

            await interaction.update({
                content: '🔄 **กำลังอัปเดตสภาพอากาศ...**',
                components: interaction.message.components
            });

            try {
                const weather = await getWeather(lat, long);
                const embed = makeWeatherEmbed(locationName, weather);
                const buttons = refreshButton(customData);

                await interaction.update({
                    content: '🌦️ **รายงานสภาพอากาศของคุณ (อัปเดตแล้ว)**',
                    embeds: [embed],
                    components: [buttons]
                });
            } catch (err) {
                await interaction.followUp({
                    content: '❌ ไม่สามารถอัปเดตสภาพอากาศได้',
                    ephemeral: true
                });
            }
            return;
        }

        // ปุ่มเปลี่ยนพื้นที่
        if (interaction.isButton() && interaction.customId === 'weather_choose_again') {
            return await interaction.update({
                content: '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',
                components: provinceComponents(0)
            });
        }
    }
};
