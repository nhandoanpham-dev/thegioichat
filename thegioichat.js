const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    WebhookClient
} = require("discord.js");

const fs = require("fs");

// ======================================================
// CẤU HÌNH
// ======================================================

// 🔴 DÁN TOKEN BOT CỦA BẠN VÀO ĐÂY
const TOKEN = "MTUyODc4OTc5MDcxODE2NTA3Mg.GagCPY.8U05sBDP2mpf4Y9Ctsl7VxHwjkjQhaX7EVTYB4";

// 🔴 DÁN ID DISCORD CỦA BẠN VÀO ĐÂY
// Người có ID này mới được dùng ycamserver,
// ybochamserver, ydanhsachserver, ydanhsachcam
const OWNER_ID = "1059280512998453249";

// File lưu dữ liệu
const DATA_FILE = "./worldchat.json";

// ======================================================
// KHỞI TẠO BOT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ======================================================
// TẠO DATABASE NẾU CHƯA CÓ
// ======================================================

function createDatabase() {

    if (!fs.existsSync(DATA_FILE)) {

        const defaultData = {
            guilds: {},
            bannedGuilds: []
        };

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(defaultData, null, 4)
        );
    }
}

createDatabase();

// ======================================================
// ĐỌC DATABASE
// ======================================================

function loadData() {

    try {

        const data = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!data.guilds) {
            data.guilds = {};
        }

        if (!data.bannedGuilds) {
            data.bannedGuilds = [];
        }

        return data;

    } catch (error) {

        console.log("❌ Lỗi đọc worldchat.json");

        return {
            guilds: {},
            bannedGuilds: []
        };
    }
}

// ======================================================
// LƯU DATABASE
// ======================================================

function saveData(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4)
    );
}

// ======================================================
// KIỂM TRA CHỦ BOT
// ======================================================

function isOwner(message) {

    return message.author.id === OWNER_ID;
}

// ======================================================
// KIỂM TRA SERVER BỊ CẤM
// ======================================================

function isGuildBanned(data, guildId) {

    return data.bannedGuilds.includes(guildId);
}

// ======================================================
// BOT ONLINE
// ======================================================

client.once("ready", () => {

    console.log("");
    console.log("======================================");
    console.log("       WORLD CHAT BOT ONLINE");
    console.log("======================================");
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🌎 World Chat: Đang hoạt động`);
    console.log("======================================");
    console.log("");

});

// ======================================================
// XÓA WEBHOOK
// ======================================================

async function deleteGuildWebhook(guildData) {

    if (!guildData) {
        return;
    }

    if (!guildData.webhookId || !guildData.webhookToken) {
        return;
    }

    try {

        const webhook = new WebhookClient({
            id: guildData.webhookId,
            token: guildData.webhookToken
        });

        await webhook.delete();

    } catch (error) {

        console.log(
            "⚠️ Không thể xóa webhook cũ."
        );
    }
}

// ======================================================
// NHẬN TIN NHẮN
// ======================================================

client.on("messageCreate", async (message) => {

    // Không xử lý tin nhắn của bot
    if (message.author.bot) {
        return;
    }

    // Chỉ xử lý trong server
    if (!message.guild) {
        return;
    }

    const data = loadData();

    const command = message.content.trim();

    const guildId = message.guild.id;

    const guildData = data.guilds[guildId];

    const banned = isGuildBanned(
        data,
        guildId
    );

    // ==================================================
    // LỆNH: YTHEGIOICHAT
    // ==================================================

    if (command === "ythegioichat") {

        // Kiểm tra quyền
        if (!message.member.permissions.has(
            PermissionsBitField.Flags.ManageGuild
        )) {

            return message.reply(
                "❌ Bạn cần quyền **Quản lý máy chủ** để sử dụng lệnh này."
            );
        }

        // Kiểm tra bị cấm
        if (banned) {

            return message.reply(
                "❌ Máy chủ này đang bị cấm khỏi Thế Giới Chat."
            );
        }

        // ==============================================
        // KHÔNG CHO THIẾT LẬP LẦN 2
        // ==============================================

        if (guildData) {

            return message.reply(
                `❌ Máy chủ này đã thiết lập Thế Giới Chat tại <#${guildData.channelId}>.\n` +
                `Nếu muốn đổi kênh, hãy dùng \`yhuythegioichat\` trước.`
            );
        }

        // ==============================================
        // TẠO WEBHOOK
        // ==============================================

        let webhook;

        try {

            webhook = await message.channel.createWebhook({
                name: "World Chat"
            });

        } catch (error) {

            console.log(error);

            return message.reply(
                "❌ Không thể tạo Webhook.\n\n" +
                "Hãy cấp cho bot quyền **Manage Webhooks** trong kênh này."
            );
        }

        // ==============================================
        // LƯU THÔNG TIN
        // ==============================================

        data.guilds[guildId] = {

            channelId: message.channel.id,

            webhookId: webhook.id,

            webhookToken: webhook.token
        };

        saveData(data);

        return message.reply(
            `🌎 Đã thiết lập **Thế Giới Chat** tại ${message.channel}.`
        );
    }

    // ==================================================
    // LỆNH: YHUYTHEGIOICHAT
    // ==================================================

    if (command === "yhuythegioichat") {

        if (!message.member.permissions.has(
            PermissionsBitField.Flags.ManageGuild
        )) {

            return message.reply(
                "❌ Bạn cần quyền **Quản lý máy chủ**."
            );
        }

        // Chưa thiết lập
        if (!guildData) {

            return message.reply(
                "❌ Máy chủ này chưa thiết lập Thế Giới Chat."
            );
        }

        // Xóa webhook
        await deleteGuildWebhook(
            guildData
        );

        // Xóa database
        delete data.guilds[guildId];

        saveData(data);

        return message.reply(
            "✅ Đã hủy Thế Giới Chat của máy chủ này."
        );
    }

    // ==================================================
    // LỆNH: YCAMSERVER
    // ==================================================

    if (command.startsWith("ycamserver")) {

        // Chỉ chủ bot
        if (!isOwner(message)) {

            return message.reply(
                "❌ Chỉ chủ bot mới được sử dụng lệnh này."
            );
        }

        const args = command.split(/\s+/);

        const targetGuildId = args[1];

        if (!targetGuildId) {

            return message.reply(
                "❌ Cách dùng:\n" +
                "`ycamserver SERVER_ID`"
            );
        }

        // Tìm server
        const targetGuild =
            client.guilds.cache.get(
                targetGuildId
            );

        if (!targetGuild) {

            return message.reply(
                "❌ Bot không tìm thấy máy chủ này."
            );
        }

        // Đã bị cấm
        if (data.bannedGuilds.includes(
            targetGuildId
        )) {

            return message.reply(
                `❌ **${targetGuild.name}** đã bị cấm rồi.`
            );
        }

        // ==============================================
        // NẾU SERVER ĐANG DÙNG WORLD CHAT
        // THÌ XÓA WEBHOOK
        // ==============================================

        if (data.guilds[targetGuildId]) {

            await deleteGuildWebhook(
                data.guilds[targetGuildId]
            );

            delete data.guilds[targetGuildId];
        }

        // Thêm vào danh sách cấm
        data.bannedGuilds.push(
            targetGuildId
        );

        saveData(data);

        return message.reply(
            `🚫 Đã cấm **${targetGuild.name}** khỏi Thế Giới Chat.`
        );
    }

    // ==================================================
    // LỆNH: YBOCHAMSERVER
    // ==================================================

    if (command.startsWith("ybochamserver")) {

        if (!isOwner(message)) {

            return message.reply(
                "❌ Chỉ chủ bot mới được sử dụng lệnh này."
            );
        }

        const args = command.split(/\s+/);

        const targetGuildId = args[1];

        if (!targetGuildId) {

            return message.reply(
                "❌ Cách dùng:\n" +
                "`ybochamserver SERVER_ID`"
            );
        }

        const index =
            data.bannedGuilds.indexOf(
                targetGuildId
            );

        if (index === -1) {

            return message.reply(
                "❌ Máy chủ này không nằm trong danh sách cấm."
            );
        }

        // Xóa khỏi danh sách cấm
        data.bannedGuilds.splice(
            index,
            1
        );

        saveData(data);

        const targetGuild =
            client.guilds.cache.get(
                targetGuildId
            );

        const guildName =
            targetGuild
                ? targetGuild.name
                : targetGuildId;

        return message.reply(
            `✅ Đã bỏ cấm **${guildName}** khỏi Thế Giới Chat.`
        );
    }

    // ==================================================
    // LỆNH: YDANHSACHSERVER
    // ==================================================

    if (command === "ydanhsachserver") {

        if (!isOwner(message)) {

            return message.reply(
                "❌ Chỉ chủ bot mới được sử dụng lệnh này."
            );
        }

        const guildIds =
            Object.keys(data.guilds);

        if (guildIds.length === 0) {

            return message.reply(
                "🌎 Hiện chưa có máy chủ nào tham gia Thế Giới Chat."
            );
        }

        let result =
            "🌎 **DANH SÁCH MÁY CHỦ WORLD CHAT**\n\n";

        let number = 1;

        for (const id of guildIds) {

            const guild =
                client.guilds.cache.get(id);

            if (!guild) {
                continue;
            }

            const channelId =
                data.guilds[id].channelId;

            result +=
                `${number}. **${guild.name}**\n` +
                `   ID: \`${guild.id}\`\n` +
                `   Kênh: <#${channelId}>\n\n`;

            number++;
        }

        return message.reply(result);
    }

    // ==================================================
    // LỆNH: YDANHSACHCAM
    // ==================================================

    if (command === "ydanhsachcam") {

        if (!isOwner(message)) {

            return message.reply(
                "❌ Chỉ chủ bot mới được sử dụng lệnh này."
            );
        }

        if (data.bannedGuilds.length === 0) {

            return message.reply(
                "✅ Hiện không có máy chủ nào bị cấm."
            );
        }

        let result =
            "🚫 **DANH SÁCH MÁY CHỦ BỊ CẤM**\n\n";

        let number = 1;

        for (const id of data.bannedGuilds) {

            const guild =
                client.guilds.cache.get(id);

            const name =
                guild
                    ? guild.name
                    : "Không xác định";

            result +=
                `${number}. **${name}**\n` +
                `   ID: \`${id}\`\n\n`;

            number++;
        }

        return message.reply(result);
    }

    // ==================================================
    // SERVER BỊ CẤM
    // ==================================================

    if (banned) {
        return;
    }

    // ==================================================
    // SERVER CHƯA THIẾT LẬP WORLD CHAT
    // ==================================================

    if (!guildData) {
        return;
    }

    // ==================================================
    // CHỈ NHẬN TIN NHẮN TRONG KÊNH WORLD CHAT
    // ==================================================

    if (message.channel.id !== guildData.channelId) {
        return;
    }

    // ==================================================
    // LẤY TÊN NGƯỜI DÙNG
    // ==================================================

    const username =
        message.member?.displayName ||
        message.author.username;

    // ==================================================
    // TÊN SERVER
    // ==================================================

    const serverName =
        message.guild.name;

    // ==================================================
    // AVATAR NGƯỜI DÙNG
    // ==================================================

    const avatarURL =
        message.author.displayAvatarURL({
            extension: "png",
            size: 256
        });

    // ==================================================
    // TÊN WEBHOOK
    //
    // Đây chính là phần bạn muốn:
    //
    // ✦ Mèo Lú 「Vùng Đất Thánh」
    //
    // ==================================================

    const webhookName =
        `✦ ${username} 「${serverName}」`;

    // ==================================================
    // NỘI DUNG TIN NHẮN
    // ==================================================

    const content =
        message.content.trim();

    // Nếu tin nhắn rỗng
    if (!content && message.attachments.size === 0) {
        return;
    }

    // ==================================================
    // GỬI ĐẾN TẤT CẢ SERVER WORLD CHAT
    // ==================================================

    for (const targetGuildId of Object.keys(
        data.guilds
    )) {

        // Không gửi lại server nguồn
        if (targetGuildId === guildId) {
            continue;
        }

        // Không gửi đến server bị cấm
        if (data.bannedGuilds.includes(
            targetGuildId
        )) {
            continue;
        }

        const targetData =
            data.guilds[targetGuildId];

        // ==============================================
        // KIỂM TRA WEBHOOK
        // ==============================================

        if (
            !targetData.webhookId ||
            !targetData.webhookToken
        ) {
            continue;
        }

        try {

            const webhook =
                new WebhookClient({
                    id: targetData.webhookId,
                    token: targetData.webhookToken
                });

            // ==========================================
            // GỬI TIN NHẮN
            // ==========================================

            await webhook.send({

                // Nội dung nguyên bản
                content: content || undefined,

                // Tên Webhook = tên người + server
                username: webhookName,

                // Avatar Webhook = avatar người dùng
                avatarURL: avatarURL,

                // Không hiện phần reply
                allowedMentions: {
                    parse: []
                }

            });

        } catch (error) {

            console.log(
                `❌ Không thể gửi đến ${targetGuildId}: ${error.message}`
            );

        }
    }

});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);