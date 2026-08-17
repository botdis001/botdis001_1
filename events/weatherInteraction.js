const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

const GEO_URL =
    'https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json';

const WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast';

let geography = null;
let loadingGeography = null;

// ==================================================
// โหลดข้อมูล จังหวัด / อำเภอ / ตำบล
// ==================================================

async function loadGeography() {

    if (geography) {
        return geography;
    }

    if (loadingGeography) {
        return loadingGeography;
    }

    loadingGeography = (async () => {

        const response = await fetch(GEO_URL);

        if (!response.ok) {
            throw new Error(
                `โหลดข้อมูลพื้นที่ HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                'รูปแบบข้อมูลพื้นที่ไม่ถูกต้อง'
            );
        }

        geography = data;

        console.log(
            `🌍 Weather โหลดข้อมูล ${geography.length} จังหวัดสำเร็จ`
        );

        return geography;

    })();

    try {
        return await loadingGeography;
    } finally {
        loadingGeography = null;
    }
}

// ==================================================
// Weather Code
// ==================================================

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

        56: '🌧️ ฝนเยือกแข็ง',
        57: '🌧️ ฝนเยือกแข็งหนัก',

        61: '🌧️ ฝนเล็กน้อย',
        63: '🌧️ ฝนปานกลาง',
        65: '🌧️ ฝนตกหนัก',

        66: '🌧️ ฝนเยือกแข็ง',
        67: '🌧️ ฝนเยือกแข็งหนัก',

        71: '❄️ หิมะเล็กน้อย',
        73: '❄️ หิมะ',
        75: '❄️ หิมะตกหนัก',

        77: '🌨️ เกล็ดหิมะ',

        80: '🌦️ ฝนตกเป็นช่วง',
        81: '🌧️ ฝนตกเป็นช่วง',
        82: '⛈️ ฝนตกหนักเป็นช่วง',

        85: '🌨️ หิมะตกเป็นช่วง',
        86: '🌨️ หิมะตกหนัก',

        95: '⛈️ พายุฝนฟ้าคะนอง',
        96: '⛈️ พายุฝนฟ้าคะนองและลูกเห็บ',
        99: '⛈️ พายุฝนฟ้าคะนองและลูกเห็บหนัก'
    };

    return weather[code] || '🌤️ ไม่ทราบสภาพอากาศ';
}

// ==================================================
// ดึงสภาพอากาศ
// ==================================================

async function getWeather(latitude, longitude) {

    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),

        current:
            'temperature_2m,' +
            'relative_humidity_2m,' +
            'apparent_temperature,' +
            'precipitation,' +
            'weather_code,' +
            'wind_speed_10m',

        daily:
            'temperature_2m_max,' +
            'temperature_2m_min,' +
            'sunrise,' +
            'sunset,' +
            'precipitation_probability_max',

        timezone: 'Asia/Bangkok',

        forecast_days: '1'
    });

    const response = await fetch(
        `${WEATHER_URL}?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error(
            `Weather API HTTP ${response.status}`
        );
    }

    return await response.json();
}

// ==================================================
// หาจังหวัด
// ==================================================

function findProvince(provinceId) {

    if (!geography) return null;

    return geography.find(
        province =>
            String(province.id) ===
            String(provinceId)
    );
}

// ==================================================
// หาข้อมูลตำบล
// ==================================================

function findLocation(
    provinceId,
    districtId,
    subDistrictId
) {

    const province =
        findProvince(provinceId);

    if (!province) {
        return null;
    }

    const district =
        province.districts.find(
            district =>
                String(district.id) ===
                String(districtId)
        );

    if (!district) {
        return null;
    }

    const subDistrict =
        district.sub_districts.find(
            sub =>
                String(sub.id) ===
                String(subDistrictId)
        );

    if (!subDistrict) {
        return null;
    }

    return {
        province,
        district,
        subDistrict
    };
}

// ==================================================
// Pagination
// ==================================================

function paginate(items, page) {

    const PAGE_SIZE = 25;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                items.length / PAGE_SIZE
            )
        );

    const safePage =
        Math.max(
            0,
            Math.min(
                page,
                totalPages - 1
            )
        );

    const start =
        safePage * PAGE_SIZE;

    return {
        items:
            items.slice(
                start,
                start + PAGE_SIZE
            ),

        page: safePage,

        totalPages
    };
}

// ==================================================
// เมนูจังหวัด (รองรับ Pagination หน้าละ 25 จังหวัด)
// ==================================================

function provinceComponents(page = 0) {

    const result = paginate(geography, page);

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `weather_province_${result.page}`
            )
            .setPlaceholder(
                `🇹🇭 เลือกจังหวัด (หน้า ${result.page + 1}/${result.totalPages})`
            )
            .addOptions(
                result.items.map(
                    province => ({
                        label:
                            province.name_th
                                .slice(0, 100),

                        value:
                            String(province.id),

                        description:
                            province.name_en
                                ? province.name_en.slice(
                                    0,
                                    100
                                )
                                : 'ประเทศไทย'
                    })
                )
            );

    const menuRow =
        new ActionRowBuilder()
            .addComponents(menu);

    const navRow =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `weather_province_prev_${result.page}`
                    )
                    .setLabel(
                        '⬅️ ก่อนหน้า'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page <= 0
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `weather_province_next_${result.page}`
                    )
                    .setLabel(
                        'ถัดไป ➡️'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page >=
                        result.totalPages - 1
                    )

            );

    return [
        menuRow,
        navRow
    ];
}

// ==================================================
// เมนูอำเภอ
// ==================================================

function districtComponents(
    province,
    page = 0
) {

    const result =
        paginate(
            province.districts,
            page
        );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `weather_district_${province.id}_${result.page}`
            )
            .setPlaceholder(
                '🏘️ เลือกอำเภอ'
            )
            .addOptions(
                result.items.map(
                    district => ({
                        label:
                            district.name_th
                                .slice(0, 100),

                        value:
                            String(district.id),

                        description:
                            `จ.${province.name_th}`
                                .slice(0, 100)
                    })
                )
            );

    const menuRow =
        new ActionRowBuilder()
            .addComponents(menu);

    const navRow =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `weather_district_prev_${province.id}_${result.page}`
                    )
                    .setLabel(
                        '⬅️ ก่อนหน้า'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page <= 0
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `weather_district_next_${province.id}_${result.page}`
                    )
                    .setLabel(
                        'ถัดไป ➡️'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page >=
                        result.totalPages - 1
                    )

            );

    return [
        menuRow,
        navRow
    ];
}

// ==================================================
// เมนูตำบล
// ==================================================

function subDistrictComponents(
    province,
    district,
    page = 0
) {

    const result =
        paginate(
            district.sub_districts,
            page
        );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `weather_subdistrict_${province.id}_${district.id}_${result.page}`
            )
            .setPlaceholder(
                '📍 เลือกตำบล'
            )
            .addOptions(
                result.items.map(
                    subDistrict => ({
                        label:
                            subDistrict.name_th
                                .slice(0, 100),

                        value:
                            String(subDistrict.id),

                        description:
                            `อ.${district.name_th}`
                                .slice(0, 100)
                    })
                )
            );

    const menuRow =
        new ActionRowBuilder()
            .addComponents(menu);

    const navRow =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `weather_sub_prev_${province.id}_${district.id}_${result.page}`
                    )
                    .setLabel(
                        '⬅️ ก่อนหน้า'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page <= 0
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `weather_sub_next_${province.id}_${district.id}_${result.page}`
                    )
                    .setLabel(
                        'ถัดไป ➡️'
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
                    .setDisabled(
                        result.page >=
                        result.totalPages - 1
                    )

            );

    return [
        menuRow,
        navRow
    ];
}

// ==================================================
// สร้าง Weather Embed
// ==================================================

function makeWeatherEmbed(
    location,
    weather
) {

    const current =
        weather.current;

    const daily =
        weather.daily;

    const weatherText =
        getWeatherText(
            current.weather_code
        );

    return new EmbedBuilder()
        .setColor('#3498DB')

        .setTitle(
            '🌦️ สภาพอากาศปัจจุบัน'
        )

        .setDescription(
            `📍 **${location.subDistrict.name_th}**\n` +
            `อำเภอ ${location.district.name_th}\n` +
            `จังหวัด ${location.province.name_th}`
        )

        .addFields(

            {
                name: '🌡️ อุณหภูมิ',
                value:
                    `${current.temperature_2m} °C`,
                inline: true
            },

            {
                name: '🤒 รู้สึกเหมือน',
                value:
                    `${current.apparent_temperature} °C`,
                inline: true
            },

            {
                name: '💧 ความชื้น',
                value:
                    `${current.relative_humidity_2m}%`,
                inline: true
            },

            {
                name: '☁️ สภาพอากาศ',
                value:
                    weatherText,
                inline: true
            },

            {
                name: '💨 ลม',
                value:
                    `${current.wind_speed_10m} km/h`,
                inline: true
            },

            {
                name: '🌧️ ฝนขณะนี้',
                value:
                    `${current.precipitation} mm`,
                inline: true
            },

            {
                name: '🌡️ สูงสุดวันนี้',
                value:
                    `${daily.temperature_2m_max[0]} °C`,
                inline: true
            },

            {
                name: '🌡️ ต่ำสุดวันนี้',
                value:
                    `${daily.temperature_2m_min[0]} °C`,
                inline: true
            },

            {
                name: '🌧️ โอกาสฝนสูงสุด',
                value:
                    `${daily.precipitation_probability_max[0]}%`,
                inline: true
            },

            {
                name: '🌅 พระอาทิตย์ขึ้น',
                value:
                    formatTime(
                        daily.sunrise[0]
                    ),
                inline: true
            },

            {
                name: '🌇 พระอาทิตย์ตก',
                value:
                    formatTime(
                        daily.sunset[0]
                    ),
                inline: true
            }

        )

        .setFooter({
            text:
                'ข้อมูลจาก Open-Meteo • เวลาไทย'
        })

        .setTimestamp();
}

// ==================================================
// แปลงเวลา
// ==================================================

function formatTime(value) {

    if (!value) {
        return '-';
    }

    return new Date(value)
        .toLocaleTimeString(
            'th-TH',
            {
                timeZone:
                    'Asia/Bangkok',
                hour:
                    '2-digit',
                minute:
                    '2-digit'
            }
        );
}

// ==================================================
// ปุ่ม Refresh DM
// ==================================================

function refreshButton(
    provinceId,
    districtId,
    subDistrictId
) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `weather_refresh_${provinceId}_${districtId}_${subDistrictId}`
                )
                .setLabel(
                    '🔄 อัปเดตสภาพอากาศ'
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    'weather_choose_again'
                )
                .setLabel(
                    '📍 เปลี่ยนพื้นที่'
                )
                .setStyle(
                    ButtonStyle.Secondary
                )

        );
}

// ==================================================
// Event
// ==================================================

module.exports = {

    name: 'interactionCreate',

    async execute(interaction) {

        // ไม่ใช่ Weather
        if (
            !interaction.isButton() &&
            !interaction.isStringSelectMenu()
        ) {
            return;
        }

        // โหลดข้อมูล
        try {
            await loadGeography();
        } catch (error) {

            console.error(
                '❌ Weather Geography:',
                error.message
            );

            if (!interaction.replied) {
                await interaction.reply({
                    content:
                        '❌ ระบบข้อมูลพื้นที่ขัดข้อง กรุณาลองใหม่',
                    ephemeral: true
                }).catch(() => {});
            }

            return;
        }

        // ==================================================
        // เริ่มเลือกจังหวัด (ปุ่มเลือกพื้นที่)
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId ===
            'weather_start'
        ) {

            return await interaction.reply({

                content:
                    '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',

                components:
                    provinceComponents(0),

                ephemeral: true
            });
        }

        // ==================================================
        // จังหวัด ก่อนหน้า
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_province_prev_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const page =
                Number(parts[3]);

            return await interaction.update({

                content:
                    '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',

                components:
                    provinceComponents(
                        page - 1
                    )
            });
        }

        // ==================================================
        // จังหวัด ถัดไป
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_province_next_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const page =
                Number(parts[3]);

            return await interaction.update({

                content:
                    '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',

                components:
                    provinceComponents(
                        page + 1
                    )
            });
        }

        // ==================================================
        // เลือกจังหวัด
        // ==================================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith(
                'weather_province_'
            )
        ) {

            const provinceId =
                interaction.values[0];

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบจังหวัด',
                    ephemeral: true
                });
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n\n` +
                    '🏘️ **เลือกอำเภอ**',

                components:
                    districtComponents(
                        province,
                        0
                    )
            });
        }

        // ==================================================
        // อำเภอ ก่อนหน้า
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_district_prev_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[3];

            const page =
                Number(parts[4]);

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {
                return;
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n\n` +
                    '🏘️ **เลือกอำเภอ**',

                components:
                    districtComponents(
                        province,
                        page - 1
                    )
            });
        }

        // ==================================================
        // อำเภอ ถัดไป
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_district_next_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[3];

            const page =
                Number(parts[4]);

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {
                return;
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n\n` +
                    '🏘️ **เลือกอำเภอ**',

                components:
                    districtComponents(
                        province,
                        page + 1
                    )
            });
        }

        // ==================================================
        // เลือกอำเภอ
        // ==================================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith(
                'weather_district_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[2];

            const districtId =
                interaction.values[0];

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบจังหวัด',
                    ephemeral: true
                });
            }

            const district =
                province.districts.find(
                    item =>
                        String(item.id) ===
                        String(districtId)
                );

            if (!district) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบอำเภอ',
                    ephemeral: true
                });
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n` +
                    `🏘️ อำเภอ: **${district.name_th}**\n\n` +
                    '📍 **เลือกตำบล**',

                components:
                    subDistrictComponents(
                        province,
                        district,
                        0
                    )
            });
        }

        // ==================================================
        // ตำบล ก่อนหน้า
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_sub_prev_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[3];

            const districtId =
                parts[4];

            const page =
                Number(parts[5]);

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {
                return;
            }

            const district =
                province.districts.find(
                    item =>
                        String(item.id) ===
                        String(districtId)
                );

            if (!district) {
                return;
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n` +
                    `🏘️ อำเภอ: **${district.name_th}**\n\n` +
                    '📍 **เลือกตำบล**',

                components:
                    subDistrictComponents(
                        province,
                        district,
                        page - 1
                    )
            });
        }

        // ==================================================
        // ตำบล ถัดไป
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_sub_next_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[3];

            const districtId =
                parts[4];

            const page =
                Number(parts[5]);

            const province =
                findProvince(
                    provinceId
                );

            if (!province) {
                return;
            }

            const district =
                province.districts.find(
                    item =>
                        String(item.id) ===
                        String(districtId)
                );

            if (!district) {
                return;
            }

            return await interaction.update({

                content:
                    `📍 จังหวัด: **${province.name_th}**\n` +
                    `🏘️ อำเภอ: **${district.name_th}**\n\n` +
                    '📍 **เลือกตำบล**',

                components:
                    subDistrictComponents(
                        province,
                        district,
                        page + 1
                    )
            });
        }

        // ==================================================
        // เลือกตำบล
        // ==================================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith(
                'weather_subdistrict_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[2];

            const districtId =
                parts[3];

            const subDistrictId =
                interaction.values[0];

            const location =
                findLocation(
                    provinceId,
                    districtId,
                    subDistrictId
                );

            if (!location) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบตำบล',
                    ephemeral: true
                });
            }

            const latitude =
                Number(
                    location.subDistrict.lat
                );

            const longitude =
                Number(
                    location.subDistrict.long
                );

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                return await interaction.reply({
                    content:
                        '❌ ตำบลนี้ไม่มีพิกัดสำหรับตรวจสภาพอากาศ',
                    ephemeral: true
                });
            }

            await interaction.update({

                content:
                    '⏳ **กำลังตรวจสอบสภาพอากาศ...**\n\n' +
                    `📍 ${location.subDistrict.name_th}\n` +
                    `อ.${location.district.name_th}\n` +
                    `จ.${location.province.name_th}\n\n` +
                    '📩 เมื่อเสร็จแล้วระบบจะส่งเข้า DM',

                components: []
            });

            try {

                const weather =
                    await getWeather(
                        latitude,
                        longitude
                    );

                const embed =
                    makeWeatherEmbed(
                        location,
                        weather
                    );

                const buttons =
                    refreshButton(
                        provinceId,
                        districtId,
                        subDistrictId
                    );

                // ส่ง DM
                try {

                    await interaction.user.send({

                        content:
                            '🌦️ **รายงานสภาพอากาศของคุณ**',

                        embeds: [
                            embed
                        ],

                        components: [
                            buttons
                        ]
                    });

                    await interaction.editReply({

                        content:
                            '✅ **ส่งข้อมูลสภาพอากาศเข้า DM แล้วครับ**\n\n' +
                            `📍 ${location.subDistrict.name_th}, ` +
                            `${location.district.name_th}, ` +
                            `${location.province.name_th}`,

                        components: []
                    });

                } catch (dmError) {

                    console.error(
                        '❌ ส่ง DM ไม่ได้:',
                        dmError.message
                    );

                    await interaction.editReply({

                        content:
                            '❌ **ส่ง DM ไม่ได้ครับ**\n\n' +
                            'กรุณาเปิดรับข้อความส่วนตัวจากสมาชิกเซิร์ฟเวอร์ก่อน',

                        components: []
                    });
                }

            } catch (error) {

                console.error(
                    '❌ Weather API Error:',
                    error.message
                );

                await interaction.editReply({

                    content:
                        '❌ ไม่สามารถดึงข้อมูลสภาพอากาศได้\n' +
                        'กรุณาลองใหม่อีกครั้ง',

                    components: []
                });
            }

            return;
        }

        // ==================================================
        // Refresh จาก DM
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId.startsWith(
                'weather_refresh_'
            )
        ) {

            const parts =
                interaction.customId.split('_');

            const provinceId =
                parts[2];

            const districtId =
                parts[3];

            const subDistrictId =
                parts[4];

            const location =
                findLocation(
                    provinceId,
                    districtId,
                    subDistrictId
                );

            if (!location) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบข้อมูลพื้นที่สำหรับการอัปเดต',
                    ephemeral: true
                });
            }

            const latitude =
                Number(
                    location.subDistrict.lat
                );

            const longitude =
                Number(
                    location.subDistrict.long
                );

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                return await interaction.reply({
                    content:
                        '❌ ตำบลนี้ไม่มีพิกัดสำหรับอัปเดตสภาพอากาศ',
                    ephemeral: true
                });
            }

            await interaction.update({
                content: '🔄 **กำลังอัปเดตสภาพอากาศ...**',
                components: interaction.message.components
            });

            try {

                const weather =
                    await getWeather(
                        latitude,
                        longitude
                    );

                const embed =
                    makeWeatherEmbed(
                        location,
                        weather
                    );

                const buttons =
                    refreshButton(
                        provinceId,
                        districtId,
                        subDistrictId
                    );

                await interaction.update({

                    content:
                        '🌦️ **รายงานสภาพอากาศของคุณ (อัปเดตแล้ว)**',

                    embeds: [
                        embed
                    ],

                    components: [
                        buttons
                    ]
                });

            } catch (error) {

                console.error(
                    '❌ Weather Refresh Error:',
                    error.message
                );

                await interaction.followUp({

                    content:
                        '❌ ไม่สามารถอัปเดตสภาพอากาศได้ กรุณาลองใหม่อีกครั้ง',

                    ephemeral: true
                });
            }

            return;
        }

        // ==================================================
        // เปลี่ยนพื้นที่ (เลือกใหม่)
        // ==================================================

        if (
            interaction.isButton() &&
            interaction.customId ===
            'weather_choose_again'
        ) {

            return await interaction.update({

                content:
                    '🇹🇭 **เลือกจังหวัดที่ต้องการดูสภาพอากาศ**',

                components:
                    provinceComponents(0)
            });
        }

    }
};
