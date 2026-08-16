const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        // ==========================================
        // ⚙️ CONFIG
        // ==========================================

        const LOG_CHANNEL_ID = '1538429606409928815';
        const ROLE_ID = '1356148472851726437'; // ยศ friend

        const STEAM_API_KEY =
            process.env.STEAM_API_KEY;

        // ==========================================
        // 🕐 เวลาไทย
        // ==========================================

        const getTime = () => new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // ==========================================
        // 🔍 ตรวจ Steam VAC
        // ==========================================

        async function checkSteamVAC(steamId) {

            if (!STEAM_API_KEY) {
                throw new Error(
                    'ไม่พบ STEAM_API_KEY ใน Railway Variables'
                );
            }

            const url =
                'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/' +
                `?key=${encodeURIComponent(STEAM_API_KEY)}` +
                `&steamids=${encodeURIComponent(steamId)}`;

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
                !data.players.length
            ) {
                throw new Error(
                    'ไม่พบข้อมูล Steam ID นี้ใน Steam API'
                );
            }

            const player = data.players[0];

            return {
                steamId: player.SteamId,
                vacBanned: Boolean(player.VACBanned),
                numberOfVACBans: Number(player.NumberOfVACBans || 0),
                numberOfGameBans: Number(player.NumberOfGameBans || 0),
                communityBanned: Boolean(player.CommunityBanned),
                economyBan: player.EconomyBan || 'none',
                daysSinceLastBan: Number(player.DaysSinceLastBan || 0)
            };
        }

        // ==========================================
        // 📝 สร้าง Steam Profile
        // ==========================================

        const getSteamProfile =
            (steamId) =>
                `https://steamcommunity.com/profiles/${steamId}/`;

        // ==========================================
        // 🔍 DEBUG
        // ==========================================

        if (interaction.isButton()) {
            console.log(
                `[DEBUG] มีคนกดปุ่ม Custom ID: ${interaction.customId}`
            );
        }

        // ==========================================
        // ⚡ 0. Slash Commands
        // ==========================================

        if (interaction.isChatInputCommand()) {

            const command =
                interaction.client.commands.get(
                    interaction.commandName
                );

            if (!command) {
                console.error(
                    `[ERROR] ไม่พบคำสั่ง /${interaction.commandName}`
                );
                return;
            }

            try {

                await command.execute(interaction);

            } catch (error) {

                console.error(
                    `[ERROR] เกิดข้อผิดพลาดในการรันคำสั่ง /${interaction.commandName}:`,
                    error
                );

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.followUp({
                        content:
                            '❌ เกิดข้อผิดพลาดในการใช้คำสั่งนี้!',
                        ephemeral: true
                    }).catch(() => {});

                } else {

                    await interaction.reply({
                        content:
                            '❌ เกิดข้อผิดพลาดในการใช้คำสั่งนี้!',
                        ephemeral: true
                    }).catch(() => {});
                }
            }

            return;
        }

        // ==========================================
        // 📝 1. กดปุ่มลงทะเบียน
        // ==========================================

        if (
            interaction.isButton() &&
            interaction.customId === 'modal_role_trigger'
        ) {

            const modal = new ModalBuilder()
                .setCustomId('role_registration_modal')
                .setTitle('ตั้งชื่อและลงทะเบียน Steam');

            // ------------------------------
            // 👤 ชื่อใน Discord
            // ------------------------------

            const nicknameInput =
                new TextInputBuilder()
                    .setCustomId('nickname_input')
                    .setLabel(
                        'กรอกชื่อที่ต้องการใช้ในเซิร์ฟเวอร์'
                    )
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('เช่น John_Doe')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(32);

            // ------------------------------
            // 🎮 Steam ID64
            // ------------------------------

            const steamInput =
                new TextInputBuilder()
                    .setCustomId('steam_id_input')
                    .setLabel(
                        'กรอก Steam ID64 (17 หลัก)'
                    )
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(
                        'เช่น 7656119XXXXXXXXXX'
                    )
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

            console.log(
                `[DEBUG] เปิด Modal ให้ ${interaction.user.tag}`
            );

            return await interaction.showModal(modal);
        }

        // ==========================================
        // 📝 2. รับข้อมูลจาก Modal
        // ==========================================

        if (
            interaction.isModalSubmit() &&
            interaction.customId === 'role_registration_modal'
        ) {

            const newNickname =
                interaction.fields
                    .getTextInputValue(
                        'nickname_input'
                    )
                    .trim();

            const steamId =
                interaction.fields
                    .getTextInputValue(
                        'steam_id_input'
                    )
                    .trim();

            const member = interaction.member;

            const guild = interaction.guild;

            if (!guild || !member) {
                return await interaction.reply({
                    content:
                        '❌ ไม่สามารถอ่านข้อมูลเซิร์ฟเวอร์ได้',
                    ephemeral: true
                });
            }

            console.log(
                `[DEBUG] ${member.user.tag} ลงทะเบียนชื่อ: ${newNickname}`
            );

            console.log(
                `[DEBUG] Steam ID: ${steamId}`
            );

            // ==========================================
            // 🔢 ตรวจ Steam ID
            // ==========================================

            if (!/^\d{17}$/.test(steamId)) {

                return await interaction.reply({
                    content:
                        '❌ Steam ID ไม่ถูกต้อง\n\n' +
                        'กรุณากรอก **Steam ID64 จำนวน 17 หลัก**\n' +
                        'ตัวอย่าง: `7656119XXXXXXXXXX`',
                    ephemeral: true
                });
            }

            // ==========================================
            // 🏷️ ตรวจยศ
            // ==========================================

            const role =
                guild.roles.cache.get(ROLE_ID);

            if (!role) {

                console.log(
                    `[DEBUG] ❌ ไม่พบยศ ID: ${ROLE_ID}`
                );

                return await interaction.reply({
                    content:
                        '❌ ไม่พบยศในระบบ กรุณาแจ้งแอดมิน',
                    ephemeral: true
                });
            }

            // ==========================================
            // 👑 ตรวจเจ้าของเซิร์ฟเวอร์
            // ==========================================

            if (
                member.id === guild.ownerId
            ) {

                return await interaction.reply({
                    content:
                        '❌ บอทไม่สามารถเปลี่ยนชื่อของเจ้าของเซิร์ฟเวอร์ได้!',
                    ephemeral: true
                });
            }

            // ==========================================
            // 🤖 ตรวจสิทธิ์เปลี่ยนชื่อ
            // ==========================================

            if (!member.manageable) {

                return await interaction.reply({
                    content:
                        '❌ บอทไม่มีสิทธิ์เปลี่ยนชื่อสมาชิกนี้\n' +
                        'กรุณาตรวจสอบลำดับยศของบอท',
                    ephemeral: true
                });
            }

            // ==========================================
            // 🤖 ตรวจสิทธิ์ให้ยศ
            // ==========================================

            const botMember =
                guild.members.me ||
                guild.members.cache.get(
                    interaction.client.user.id
                );

            if (!botMember) {

                return await interaction.reply({
                    content:
                        '❌ ไม่สามารถตรวจสอบยศของบอทได้',
                    ephemeral: true
                });
            }

            if (
                role.position >=
                botMember.roles.highest.position
            ) {

                return await interaction.reply({
                    content:
                        '❌ บอทไม่สามารถให้ยศนี้ได้\n' +
                        'กรุณาเลื่อนยศบอทให้อยู่สูงกว่ายศ friend',
                    ephemeral: true
                });
            }

            // ==========================================
            // ⏳ แจ้งผู้ใช้ว่ากำลังตรวจสอบ
            // ==========================================

            await interaction.reply({
                content:
                    '⏳ กำลังตรวจสอบ Steam และ VAC ของคุณ...\n' +
                    'กรุณารอสักครู่',
                ephemeral: true
            });

            // ==========================================
            // 🎮 ตรวจ Steam VAC
            // ==========================================

            let vacData;

            try {

                vacData =
                    await checkSteamVAC(
                        steamId
                    );

                console.log(
                    `[DEBUG] Steam ตรวจสอบสำเร็จ: ${steamId}`
                );

            } catch (error) {

                console.error(
                    '[ERROR] Steam API:',
                    error.message
                );

                return await interaction.editReply({
                    content:
                        '❌ ไม่สามารถตรวจสอบ Steam ได้\n\n' +
                        'กรุณาตรวจสอบว่า:\n' +
                        '• Steam ID เป็น SteamID64 17 หลัก\n' +
                        '• Steam Web API Key ใน Railway ถูกต้อง\n' +
                        '• Steam API สามารถใช้งานได้\n\n' +
                        `รายละเอียด: ${error.message}`
                }).catch(() => {});
            }

            // ==========================================
            // 🚨 ผล VAC
            // ==========================================

            const vacStatus =
                vacData.vacBanned
                    ? '🔴 พบ VAC Ban'
                    : '🟢 ไม่พบ VAC Ban';

            // ==========================================
            // 🔗 Steam Profile
            // ==========================================

            const steamProfile =
                getSteamProfile(steamId);

            // ==========================================
            // 📝 เปลี่ยนชื่อ + ให้ยศ
            // ==========================================

            try {

                // ------------------------------
                // เปลี่ยนชื่อ
                // ------------------------------

                await member.setNickname(
                    newNickname
                );

                console.log(
                    `[DEBUG] ✅ เปลี่ยนชื่อ ${member.user.tag} → ${newNickname}`
                );

                // ------------------------------
                // เพิ่มยศ
                // ------------------------------

                let roleAdded = false;

                if (
                    !member.roles.cache.has(
                        ROLE_ID
                    )
                ) {

                    await member.roles.add(
                        ROLE_ID
                    );

                    roleAdded = true;

                    console.log(
                        `[DEBUG] ✅ เพิ่มยศ ${role.name}`
                    );

                } else {

                    console.log(
                        `[DEBUG] สมาชิกมียศ ${role.name} อยู่แล้ว`
                    );
                }

                // ==========================================
                // 💬 ข้อความตอบผู้ใช้
                // ==========================================

                await interaction.editReply({
                    content:
                        `🎉 ลงทะเบียนเรียบร้อยแล้ว!\n\n` +
                        `📝 ชื่อ: **${newNickname}**\n` +
                        `🎮 Steam ID: **${steamId}**\n` +
                        `🏷️ ยศ: **${role.name}**\n` +
                        `${vacStatus}\n\n` +
                        `🔗 [ดู Steam Profile](${steamProfile})`
                });

                // ==========================================
                // 📋 ส่ง LOG
                // ==========================================

                const logChannel =
                    await guild.channels
                        .fetch(LOG_CHANNEL_ID)
                        .catch(() => null);

                if (!logChannel) {

                    console.log(
                        `❌ ไม่พบห้อง Log ID: ${LOG_CHANNEL_ID}`
                    );

                    return;
                }

                const logText = vacData.vacBanned
                    ? `# 🚨 ลงทะเบียนรับยศ - พบ VAC`
                    : `# 🟢 ลงทะเบียนรับยศ`;

                await logChannel.send(
                    `\`\`\`md
${logText}
- ชื่อเล่นในเซิร์ฟเวอร์: ${newNickname}
- ชื่อหลัก (Username): ${member.user.tag}
- User ID: ${member.user.id}
- Steam ID: ${steamId}
- Steam Profile: ${steamProfile}
- ยศที่ได้รับ: ${role.name}
- VAC: ${vacStatus}
- VAC Ban: ${vacData.numberOfVACBans}
- Game Ban: ${vacData.numberOfGameBans}
- Community Ban: ${vacData.communityBanned ? '🔴 พบ' : '🟢 ไม่พบ'}
- Economy Ban: ${vacData.economyBan}
- วันที่ลงทะเบียน: ${getTime()}
\`\`\``
                );

                console.log(
                    `[DEBUG] ✅ ส่ง Registration Log สำเร็จ`
                );

            } catch (error) {

                console.error(
                    '[ERROR] เกิดข้อผิดพลาดตอนลงทะเบียน:',
                    error
                );

                await interaction.editReply({
                    content:
                        '❌ เกิดข้อผิดพลาดตอนลงทะเบียน\n' +
                        'ไม่สามารถเปลี่ยนชื่อหรือให้ยศได้\n\n' +
                        'กรุณาแจ้งแอดมินให้ตรวจสอบสิทธิ์ของบอท'
                }).catch(() => {});
            }
        }
    }
};
