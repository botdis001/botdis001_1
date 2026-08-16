```js
const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        // ==========================================
        // ⚙️ CONFIG
        // ==========================================

        const LOG_CHANNEL_ID = '1538429606409928815';

        // Role ที่สามารถเลือกเป็นเกมได้
        const GAME_ROLE_IDS = [
            '1527270612291158077',
            '1462774552726606017',
            '1538468356049477664',
            '1356148472851726437'
        ];

        const STEAM_API_KEY = process.env.STEAM_API_KEY;

        // ==========================================
        // 🕐 เวลาไทย
        // ==========================================

        const getTime = () => {
            return new Date().toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        // ==========================================
        // 🎮 ตรวจ Steam VAC
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
                numberOfVACBans:
                    Number(player.NumberOfVACBans || 0),
                numberOfGameBans:
                    Number(player.NumberOfGameBans || 0),
                communityBanned:
                    Boolean(player.CommunityBanned),
                economyBan:
                    player.EconomyBan || 'none',
                daysSinceLastBan:
                    Number(player.DaysSinceLastBan || 0)
            };
        }

        // ==========================================
        // 🔗 Steam Profile
        // ==========================================

        const getSteamProfile = (steamId) => {
            return `https://steamcommunity.com/profiles/${steamId}/`;
        };

        // ==========================================
        // 🔍 DEBUG
        // ==========================================

        if (interaction.isButton()) {
            console.log(
                `[DEBUG] Button: ${interaction.customId}`
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
                    `[ERROR] /${interaction.commandName}:`,
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
                .setCustomId(
                    'role_registration_modal'
                )
                .setTitle(
                    'ตั้งชื่อและลงทะเบียน Steam'
                );

            // ชื่อ
            const nicknameInput =
                new TextInputBuilder()
                    .setCustomId(
                        'nickname_input'
                    )
                    .setLabel(
                        'ชื่อที่ต้องการใช้ในเซิร์ฟเวอร์'
                    )
                    .setStyle(
                        TextInputStyle.Short
                    )
                    .setPlaceholder(
                        'เช่น Masaru'
                    )
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(32);

            // Steam ID
            const steamInput =
                new TextInputBuilder()
                    .setCustomId(
                        'steam_id_input'
                    )
                    .setLabel(
                        'Steam ID64 (17 หลัก)'
                    )
                    .setStyle(
                        TextInputStyle.Short
                    )
                    .setPlaceholder(
                        'เช่น 7656119XXXXXXXXXX'
                    )
                    .setRequired(true)
                    .setMinLength(17)
                    .setMaxLength(17);

            const nicknameRow =
                new ActionRowBuilder()
                    .addComponents(
                        nicknameInput
                    );

            const steamRow =
                new ActionRowBuilder()
                    .addComponents(
                        steamInput
                    );

            modal.addComponents(
                nicknameRow,
                steamRow
            );

            return await interaction.showModal(
                modal
            );
        }

        // ==========================================
        // 📝 2. รับข้อมูลจาก Modal
        // ==========================================

        if (
            interaction.isModalSubmit() &&
            interaction.customId ===
                'role_registration_modal'
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
                `[DEBUG] ${member.user.tag} ลงทะเบียน`
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
            // ⏳ ตอบก่อนตรวจ API
            // ==========================================

            await interaction.reply({
                content:
                    '⏳ กำลังตรวจสอบ Steam และ VAC...\n' +
                    'กรุณารอสักครู่',
                ephemeral: true
            });

            // ==========================================
            // 🛡️ ตรวจ VAC
            // ==========================================

            let vacData;

            try {

                vacData =
                    await checkSteamVAC(
                        steamId
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
                        '• Steam API Key ถูกต้อง\n' +
                        '• Steam ID เป็นของบัญชีที่มีอยู่จริง\n\n' +
                        `รายละเอียด: ${error.message}`
                }).catch(() => {});
            }

            // ==========================================
            // 🚨 สถานะ VAC
            // ==========================================

            const vacStatus =
                vacData.vacBanned
                    ? '🔴 พบ VAC Ban'
                    : '🟢 ไม่พบ VAC Ban';

            // ==========================================
            // 🎮 ดึง Role เกม
            // ==========================================

            const gameRoles = [];

            for (const roleId of GAME_ROLE_IDS) {

                const role =
                    guild.roles.cache.get(
                        roleId
                    );

                if (!role) {
                    console.error(
                        `❌ ไม่พบ Role ID: ${roleId}`
                    );
                    continue;
                }

                gameRoles.push(role);
            }

            if (gameRoles.length === 0) {

                return await interaction.editReply({
                    content:
                        '❌ ไม่พบยศเกมที่ตั้งค่าไว้ในระบบ\n' +
                        'กรุณาแจ้งแอดมิน'
                }).catch(() => {});
            }

            // ==========================================
            // 🎮 สร้างเมนูเลือกเกม
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
                    .addComponents(
                        selectMenu
                    );

            await interaction.editReply({
                content:
                    `✅ ตรวจสอบ Steam สำเร็จ\n\n` +
                    `🎮 Steam ID: **${steamId}**\n` +
                    `${vacStatus}\n\n` +
                    `กรุณาเลือก **เกมที่ต้องการรับยศ** จากเมนูด้านล่าง`,
                components: [row]
            });

            return;
        }

        // ==========================================
        // 🎮 3. เลือกเกม
        // ==========================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith(
                'game_role_select_'
            )
        ) {

            const ownerId =
                interaction.customId.replace(
                    'game_role_select_',
                    ''
                );

            // ป้องกันคนอื่นมากดเมนู
            if (
                interaction.user.id !== ownerId
            ) {

                return await interaction.reply({
                    content:
                        '❌ เมนูนี้เป็นของสมาชิกคนอื่น',
                    ephemeral: true
                });
            }

            const selectedRoleId =
                interaction.values[0];

            // ==========================================
            // ตรวจว่า Role อยู่ในรายการที่อนุญาต
            // ==========================================

            if (
                !GAME_ROLE_IDS.includes(
                    selectedRoleId
                )
            ) {

                return await interaction.reply({
                    content:
                        '❌ ยศเกมนี้ไม่ได้รับอนุญาต',
                    ephemeral: true
                });
            }

            const guild =
                interaction.guild;

            const member =
                interaction.member;

            const selectedRole =
                guild.roles.cache.get(
                    selectedRoleId
                );

            if (!selectedRole) {

                return await interaction.reply({
                    content:
                        '❌ ไม่พบยศเกมนี้ในเซิร์ฟเวอร์',
                    ephemeral: true
                });
            }

            // ==========================================
            // 🤖 ตรวจบอทจัดการ Role
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
                selectedRole.position >=
                botMember.roles.highest.position
            ) {

                return await interaction.reply({
                    content:
                        '❌ บอทไม่สามารถให้ยศนี้ได้\n' +
                        'กรุณาเลื่อนยศบอทให้อยู่สูงกว่ายศเกม',
                    ephemeral: true
                });
            }

            // ==========================================
            // 📝 อ่านข้อมูล Steam จากข้อความเดิม
            // ==========================================

            const originalMessage =
                interaction.message;

            let steamId = 'ไม่ทราบ';

            if (
                originalMessage &&
                originalMessage.content
            ) {

                const match =
                    originalMessage.content.match(
                        /Steam ID:\s*\*\*(\d{17})\*\*/
                    );

                if (match) {
                    steamId = match[1];
                }
            }

            // ==========================================
            // 🛡️ ตรวจ VAC อีกครั้งเพื่อความปลอดภัย
            // ==========================================

            let vacData = null;

            if (
                steamId !== 'ไม่ทราบ'
            ) {

                try {

                    vacData =
                        await checkSteamVAC(
                            steamId
                        );

                } catch (error) {

                    console.error(
                        '[ERROR] ตรวจ VAC รอบสอง:',
                        error.message
                    );
                }
            }

            const vacStatus =
                vacData
                    ? (
                        vacData.vacBanned
                            ? '🔴 พบ VAC Ban'
                            : '🟢 ไม่พบ VAC Ban'
                    )
                    : '⚠️ ไม่สามารถอ่านข้อมูล VAC ซ้ำได้';

            // ==========================================
            // 📝 เปลี่ยนชื่อ
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

            // ==========================================
            // 🏷️ แจก Role
            // ==========================================

            try {

                await member.setNickname(
                    member.nickname || member.user.username
                ).catch(() => {});

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
                // 📋 Log
                // ==========================================

                const logChannel =
                    await guild.channels
                        .fetch(LOG_CHANNEL_ID)
                        .catch(() => null);

                if (logChannel) {

                    const logTitle =
                        vacData &&
                        vacData.vacBanned
                            ? '# 🔴 สมาชิกรับยศเกม - พบ VAC'
                            : '# 🟢 สมาชิกรับยศเกม';

                    await logChannel.send(
                        `\`\`\`md
${logTitle}

- ชื่อดิสคอร์ด: ${member.user.tag}
- Discord User ID: ${member.user.id}
- ชื่อในเซิร์ฟ: ${member.displayName}
- Steam ID64: ${steamId}
- Steam Profile: ${getSteamProfile(steamId)}
- VAC: ${vacStatus}
- VAC Ban: ${vacData ? vacData.numberOfVACBans : 'ไม่ทราบ'}
- Game Ban: ${vacData ? vacData.numberOfGameBans : 'ไม่ทราบ'}
- เกมที่เลือก: ${selectedRole.name}
- ยศที่ได้รับ: ${selectedRole.name}
- Role ID: ${selectedRole.id}
- เวลา: ${getTime()}
\`\`\``
                    );
                }

                // ==========================================
                // 💬 ตอบสมาชิก
                // ==========================================

                await interaction.update({
                    content:
                        `🎉 **ลงทะเบียนสำเร็จ!**\n\n` +
                        `👤 ชื่อในเซิร์ฟ: **${member.displayName}**\n` +
                        `🎮 เกม: **${selectedRole.name}**\n` +
                        `🏷️ ยศที่ได้รับ: **${selectedRole.name}**\n` +
                        `${vacStatus}\n\n` +
                        `ขอบคุณสำหรับการลงทะเบียนครับ!`,
                    components: []
                });

                console.log(
                    `✅ ${member.user.tag} ได้รับ Role ${selectedRole.name} (${selectedRole.id})`
                );

            } catch (error) {

                console.error(
                    '[ERROR] แจก Role:',
                    error
                );

                await interaction.reply({
                    content:
                        '❌ ไม่สามารถให้ยศได้\n' +
                        'กรุณาตรวจสอบสิทธิ์และตำแหน่งยศของบอท',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
};
```
