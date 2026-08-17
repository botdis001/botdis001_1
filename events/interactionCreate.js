const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');

// เก็บข้อมูลสมาชิกระหว่างรอเลือกเกม
const registrationData = new Map();

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        // ==========================================
        // CONFIG
        // ==========================================

        const LOG_CHANNEL_ID = '1538429606409928815';

        const GAME_ROLE_IDS = [
            '1527270612291158077',
            '1462774552726606017',
            '1538468356049477664',
            '1356148472851726437'
        ];

        const STEAM_API_KEY = process.env.STEAM_API_KEY;

        // ==========================================
        // เวลาไทย
        // ==========================================

        function getTime() {
            return new Date().toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // ==========================================
        // ตรวจ Steam / VAC
        // ==========================================

        async function checkSteamVAC(steamId) {

            if (!STEAM_API_KEY) {
                throw new Error(
                    'ไม่พบ STEAM_API_KEY ใน Railway Variables'
                );
            }

            const url =
                'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/' +
                '?key=' + encodeURIComponent(STEAM_API_KEY) +
                '&steamids=' + encodeURIComponent(steamId);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Steam API HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (
                !data ||
                !Array.isArray(data.players) ||
                data.players.length === 0
            ) {
                throw new Error(
                    'ไม่พบข้อมูล Steam ID นี้'
                );
            }

            const player = data.players[0];

            return {
                steamId: player.SteamId,
                vacBanned: Boolean(player.VACBanned),
                numberOfVACBans: Number(
                    player.NumberOfVACBans || 0
                ),
                numberOfGameBans: Number(
                    player.NumberOfGameBans || 0
                ),
                communityBanned: Boolean(
                    player.CommunityBanned
                ),
                economyBan: player.EconomyBan || 'none'
            };
        }

        // ==========================================
        // Slash Commands
        // ==========================================

        if (interaction.isChatInputCommand()) {

            const command =
                interaction.client.commands.get(
                    interaction.commandName
                );

            if (!command) {
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {

                console.error(
                    `❌ Error /${interaction.commandName}:`,
                    error
                );

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {
                    await interaction.followUp({
                        content: '❌ เกิดข้อผิดพลาดในการใช้คำสั่งนี้',
                        ephemeral: true
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: '❌ เกิดข้อผิดพลาดในการใช้คำสั่งนี้',
                        ephemeral: true
                    }).catch(() => {});
                }
            }

            return;
        }

        // ==========================================
        // กดปุ่มเช็กสภาพอากาศตามตำแหน่งของฉัน (ส่งลิงก์ส่วนตัวพร้อมแนบ userId)
        // ==========================================

        if (
            interaction.isButton() &&
            interaction.customId === 'weather_location_link'
        ) {
            const userId = interaction.user.id;
            const userWeatherUrl = `https://botdis0011-production.up.railway.app/weather.html?userId=${userId}`;

            return await interaction.reply({
                content: `📍 กรุณาคลิกที่ลิงก์ส่วนตัวด้านล่างเพื่อตรวจสอบสภาพอากาศของคุณ:\n👉 ${userWeatherUrl}`,
                ephemeral: true
            });
        }

        // ==========================================
        // กดปุ่มลงทะเบียน Steam
        // ==========================================

        if (
            interaction.isButton() &&
            interaction.customId === 'modal_role_trigger'
        ) {

            const modal = new ModalBuilder()
                .setCustomId('role_registration_modal')
                .setTitle('ลงทะเบียน Steam');

            const nicknameInput =
                new TextInputBuilder()
                    .setCustomId('nickname_input')
                    .setLabel('ชื่อที่ต้องการใช้ในเซิร์ฟเวอร์')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('เช่น Masaru')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(32);

            const steamInput =
                new TextInputBuilder()
                    .setCustomId('steam_id_input')
                    .setLabel('Steam ID64 จำนวน 17 หลัก')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('เช่น 7656119XXXXXXXXXX')
                    .setRequired(true)
                    .setMinLength(17)
                    .setMaxLength(17);

            const nicknameRow =
                new ActionRowBuilder()
                    .addComponents(nicknameInput);

            const steamRow =
                new ActionRowBuilder()
                    .addComponents(steamInput);

            modal.addComponents(
                nicknameRow,
                steamRow
            );

            return await interaction.showModal(modal);
        }

        // ==========================================
        // ส่ง Modal (ลงทะเบียน Steam)
        // ==========================================

        if (
            interaction.isModalSubmit() &&
            interaction.customId === 'role_registration_modal'
        ) {

            const nickname =
                interaction.fields
                    .getTextInputValue('nickname_input')
                    .trim();

            const steamId =
                interaction.fields
                    .getTextInputValue('steam_id_input')
                    .trim();

            const member = interaction.member;
            const guild = interaction.guild;

            if (!guild || !member) {
                return await interaction.reply({
                    content: '❌ ไม่พบข้อมูลสมาชิก',
                    ephemeral: true
                });
            }

            // ตรวจ Steam ID
            if (!/^\d{17}$/.test(steamId)) {
                return await interaction.reply({
                    content:
                        '❌ Steam ID ไม่ถูกต้อง\n\n' +
                        'กรุณากรอก Steam ID64 จำนวน 17 หลัก',
                    ephemeral: true
                });
            }

            await interaction.reply({
                content:
                    '⏳ กำลังตรวจสอบ Steam และ VAC...',
                ephemeral: true
            });

            let vacData;

            try {

                vacData =
                    await checkSteamVAC(steamId);

            } catch (error) {

                console.error(
                    '❌ Steam API:',
                    error.message
                );

                return await interaction.editReply({
                    content:
                        '❌ ตรวจสอบ Steam ไม่สำเร็จ\n\n' +
                        `รายละเอียด: ${error.message}`
                }).catch(() => {});
            }

            const vacStatus =
                vacData.vacBanned
                    ? '🔴 พบ VAC Ban'
                    : '🟢 ไม่พบ VAC Ban';

            // ==========================================
            // ดึง Role เกม
            // ==========================================

            const gameRoles = [];

            for (const roleId of GAME_ROLE_IDS) {

                const role =
                    guild.roles.cache.get(roleId);

                if (role) {
                    gameRoles.push(role);
                } else {
                    console.error(
                        `❌ ไม่พบ Role: ${roleId}`
                    );
                }
            }

            if (gameRoles.length === 0) {

                return await interaction.editReply({
                    content:
                        '❌ ไม่พบยศเกมในเซิร์ฟเวอร์'
                }).catch(() => {});
            }

            // ==========================================
            // เก็บข้อมูลสมาชิก
            // ==========================================

            registrationData.set(member.id, {
                nickname: nickname,
                steamId: steamId,
                vacData: vacData,
                createdAt: Date.now()
            });

            // ลบข้อมูลเก่าหลัง 10 นาที
            setTimeout(() => {
                const data =
                    registrationData.get(member.id);

                if (
                    data &&
                    Date.now() - data.createdAt >= 10 * 60 * 1000
                ) {
                    registrationData.delete(member.id);
                }
            }, 10 * 60 * 1000);

            // ==========================================
            // สร้างเมนูเกม
            // ==========================================

            const options = gameRoles.map(role => ({
                label: role.name.slice(0, 100),
                value: role.id,
                description:
                    `รับยศ ${role.name}`.slice(0, 100)
            }));

            const selectMenu =
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `game_role_select_${member.id}`
                    )
                    .setPlaceholder(
                        '🎮 เลือกเกมที่ต้องการรับยศ'
                    )
                    .addOptions(options);

            const row =
                new ActionRowBuilder()
                    .addComponents(selectMenu);

            await interaction.editReply({
                content:
                    '✅ ตรวจสอบ Steam สำเร็จ\n\n' +
                    `🎮 Steam ID64: **${steamId}**\n` +
                    `${vacStatus}\n\n` +
                    '👇 กรุณาเลือกเกมที่ต้องการรับยศ',
                components: [row]
            });

            return;
        }

        // ==========================================
        // เลือกเกม
        // ==========================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith(
                'game_role_select_'
            )
        ) {

            const memberId =
                interaction.customId.replace(
                    'game_role_select_',
                    ''
                );

            // ป้องกันคนอื่นกด
            if (
                interaction.user.id !== memberId
            ) {
                return await interaction.reply({
                    content:
                        '❌ เมนูนี้เป็นของสมาชิกคนอื่น',
                    ephemeral: true
                });
            }

            // ==========================================
            // ดึงข้อมูลที่เก็บไว้
            // ==========================================

            const data =
                registrationData.get(memberId);

            if (!data) {
                return await interaction.reply({
                    content:
                        '❌ ข้อมูลการลงทะเบียนหมดอายุแล้ว\n' +
                        'กรุณากดลงทะเบียนใหม่',
                    ephemeral: true
                });
            }

            const selectedRoleId =
                interaction.values[0];

            // ==========================================
            // ตรวจ Role
            // ==========================================

            if (
                !GAME_ROLE_IDS.includes(
                    selectedRoleId
                )
            ) {
                return await interaction.reply({
                    content:
                        '❌ ยศนี้ไม่ได้อยู่ในรายการเกมที่อนุญาต',
                    ephemeral: true
                });
            }

            const guild = interaction.guild;
            const member = interaction.member;

            const selectedRole =
                guild.roles.cache.get(
                    selectedRoleId
                );

            if (!selectedRole) {
                return await interaction.reply({
                    content:
                        '❌ ไม่พบยศเกมนี้',
                    ephemeral: true
                });
            }

            // ==========================================
            // ตรวจตำแหน่ง Role ของบอท
            // ==========================================

            const botMember =
                guild.members.me ||
                guild.members.cache.get(
                    interaction.client.user.id
                );

            if (!botMember) {
                return await interaction.reply({
                    content:
                        '❌ ไม่พบข้อมูลยศของบอท',
                    ephemeral: true
                });
            }

            if (
                selectedRole.position >=
                botMember.roles.highest.position
            ) {
                return await interaction.reply({
                    content:
                        '❌ บอทไม่สามารถให้ยศนี้ได้\n\n' +
                        'ให้ลาก Role ของบอทขึ้นไปอยู่สูงกว่า Role เกม',
                    ephemeral: true
                });
            }

            // ==========================================
            // เปลี่ยนชื่อ
            // ==========================================

            if (
                member.id === guild.ownerId
            ) {
                return await interaction.reply({
                    content:
                        '❌ บอทไม่สามารถเปลี่ยนชื่อเจ้าของเซิร์ฟเวอร์ได้',
                    ephemeral: true
                });
            }

            if (!member.manageable) {
                return await interaction.reply({
                    content:
                        '❌ บอทไม่มีสิทธิ์เปลี่ยนชื่อสมาชิกนี้',
                    ephemeral: true
                });
            }

            try {

                // เปลี่ยนชื่อเป็นชื่อที่กรอก
                await member.setNickname(
                    data.nickname
                );

                // แจก Role
                if (
                    !member.roles.cache.has(
                        selectedRole.id
                    )
                ) {
                    await member.roles.add(
                        selectedRole
                    );
                }

                // ==========================================
                // VAC
                // ==========================================

                const vacStatus =
                    data.vacData.vacBanned
                        ? '🔴 พบ VAC Ban'
                        : '🟢 ไม่พบ VAC Ban';

                // ==========================================
                // LOG
                // ==========================================

                const logChannel =
                    await guild.channels
                        .fetch(LOG_CHANNEL_ID)
                        .catch(() => null);

                if (logChannel) {

                    const title =
                        data.vacData.vacBanned
                            ? '# 🔴 สมาชิกรับยศเกม - พบ VAC'
                            : '# 🟢 สมาชิกรับยศเกม';

                    const logText =
`${title}

- ชื่อดิสคอร์ด: ${member.user.tag}
- Discord User ID: ${member.user.id}
- ชื่อในเซิร์ฟ: ${data.nickname}
- Steam ID64: ${data.steamId}
- Steam Profile: https://steamcommunity.com/profiles/${data.steamId}
- VAC: ${vacStatus}
- VAC Ban: ${data.vacData.numberOfVACBans}
- Game Ban: ${data.vacData.numberOfGameBans}
- เกมที่เลือก: ${selectedRole.name}
- ยศที่ได้รับ: ${selectedRole.name}
- Role ID: ${selectedRole.id}
- เวลา: ${getTime()}`;

                    await logChannel.send(
                        `\`\`\`md\n${logText}\n\`\`\``
                    );
                }

                // ==========================================
                // ลบข้อมูลชั่วคราว
                // ==========================================

                registrationData.delete(
                    member.id
                );

                // ==========================================
                // ตอบสมาชิก
                // ==========================================

                await interaction.update({
                    content:
                        '🎉 **ลงทะเบียนสำเร็จ!**\n\n' +
                        `👤 ชื่อในเซิร์ฟ: **${data.nickname}**\n` +
                        `🎮 เกม: **${selectedRole.name}**\n` +
                        `🏷️ ยศที่ได้รับ: **${selectedRole.name}**\n` +
                        `${vacStatus}\n\n` +
                        'ขอบคุณสำหรับการลงทะเบียนครับ!',
                    components: []
                });

                console.log(
                    `✅ ${member.user.tag} ได้รับยศ ${selectedRole.name}`
                );

            } catch (error) {

                console.error(
                    '❌ เกิดข้อผิดพลาดตอนลงทะเบียน:',
                    error
                );

                await interaction.reply({
                    content:
                        '❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อหรือให้ยศ\n' +
                        'กรุณาตรวจสอบสิทธิ์ของบอท',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
};
