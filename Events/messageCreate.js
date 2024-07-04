const client = global.client;
const { Events, ChannelType, EmbedBuilder, bold } = require("discord.js");
const system = require("../System");
const pinSchema = require("../Schema/Pin");
const staffSchema = require("../Schema/Staff");
const staffFunctions = require("../Functions/Staff");
const OneDay = 1000 * 60 * 60 * 24;

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.author.bot || !message.guild || message.webhookID || message.channel.type === ChannelType.DM) return;

    const categories = system.pinCategories;
    if (message.attachments.size === 0 && categories.includes(message.channel.parentId)) {
        await message.delete();
        const deleteMessage = await message.channel.send({ content: 'Bu kategoride sadece fotoğraf paylaşabilirsiniz!' });
        setTimeout(() => {
            deleteMessage.delete();
        }, 3000);
    }

    if (message.attachments.size > 0 && categories.includes(message.channel.parentId)) {
        let count = 0;

        await Promise.all(message.attachments.map(attachment => attachment.url).map(async (url) => {
            if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif')) {
                count++;
            }
        }));

        const now = new Date();
        let document = await pinSchema.findOne({ id: message.author.id });
        if (!document) {
            document = new pinSchema({ id: message.author.id });
            await document.save();
        }

        const diff = now.valueOf() - document.lastDayTime;

        if (diff >= OneDay) {
            document.days += Math.floor(diff / OneDay);
            document.lastDayTime = now.setHours(0, 0, 0, 0);
            document.markModified('days lastDayTime');
        }

        if (!document.pin) document.pin = {};
        if (!document.pin[document.days]) document.pin[document.days] = { total: 0 };
        document.lastPinDate = now;

        const dayData = document.pin[document.days];
        dayData.total += count;
        dayData[message.channel.id] = (dayData[message.channel.id] || 0) + count;
        document.markModified('pin');
        await document.save();

        const pinsCount = document.pin || {};
        const totalPin = Object.keys(pinsCount).reduce((totalCount, currentDay) => totalCount + pinsCount[currentDay].total, 0);

        const gifLog = message.guild.channels.cache.get(system.logChannelId);
        if (count > 0 && gifLog) {
            gifLog.send({
                embeds: [
                    new EmbedBuilder({
                        description: [
                            `${message.author} (\`${message.author.id}\`) adlı kullanıcı ${bold(message.channel.name)} adlı kanalda ${bold(count)} adet fotoğraf paylaştı.\n`,
                            `📌 Bugün toplamda ${bold(dayData.total)} adet fotoğraf paylaşmış.`,
                            `📌 Toplamda ${bold(totalPin)} adet fotoğraf paylaşmış.`,
                        ].join('\n'),
                    })
                ]
            });
        }

        if (!staffFunctions.checkStaff(message.member)) return;
        const staffDocument = await staffSchema.findOne({ id: message.author.id });
        if (!staffDocument) {
            const newStaff = new staffSchema({ id: message.author.id });
            await newStaff.save();
            return;
        }

        await staffFunctions.checkPinCount(staffDocument, count);
        await staffFunctions.checkRole(message.member, staffDocument);
        await staffDocument.save();
    }
})