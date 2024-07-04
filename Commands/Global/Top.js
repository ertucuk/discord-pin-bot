const { EmbedBuilder, codeBlock, inlineCode, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const pinSchema = require("../../Schema/Pin");

module.exports = {
    name: 'top',
    aliases: ['sıralama'],

    execute: async (client, message, args) => {

        const guildMembers = message.guild.members.cache.map(member => member.user.id);
        const totalData = Math.ceil((await pinSchema.find({ pin: { $exists: true, $ne: {} }, id: { $in: guildMembers } }).countDocuments()) / 10);

        let total;
        total = {
            $reduce: {
                input: { $objectToArray: `$pin` },
                initialValue: 0,
                in: { $add: ['$$value', '$$this.v.total'] }
            }
        }

        const data = await pinSchema.aggregate([
            { $project: { id: '$id', total: total } },
            { $match: { id: { $in: guildMembers }, total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $limit: 10 },
            { $project: { id: 1, total: 1 } },
        ]);

        let page = 1;

        const embed = new EmbedBuilder({
            author: { name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) },
            thumbnail: { url: message.guild.iconURL({ dynamic: true }) },
            description: `Aşağıda genel pin sıralaması bulunmaktadır.\n\n${data.map((d, i) => `\`${i + 1}.\` ${message.guild.members.cache.has(d.id) ? message.guild.members.cache.get(d.id) : '<@' + d.id + '>'} • ${d.total} Pin`).join('\n')}`,
        })

        const msg = await message.channel.send({
            embeds: [embed],
            components: [getButton(page, totalData)]
        })

        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page = page > 1 ? page - 1 : page;
            if (i.customId === 'next') page = page < totalData ? page + 1 : page;
            if (i.customId === 'last') page = totalData;

            const data = await pinSchema.aggregate([
                { $project: { id: '$id', total: total } },
                { $match: { id: { $in: guildMembers }, total: { $gt: 0 } } },
                { $sort: { total: -1 } },
                { $skip: (page - 1) * 10 },
                { $limit: 10 },
                { $project: { id: 1, total: 1 } },
            ]);

            msg.edit({
                embeds: [embed.setDescription(`${data.map((d, i) => `\`${i + 1}.\` ${message.guild.members.cache.has(d.id) ? message.guild.members.cache.get(d.id) : '<@' + d.id + '>'} • ${d.total} Pin`).join('\n')}`)],
                components: [getButton(page, totalData)]
            })
        });
    }
}

function getButton (Page, TotalData) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setEmoji('1070037431690211359')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(Page === 1),
            new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji('1061272577332498442')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(Page === 1),
            new ButtonBuilder()
                .setCustomId('count')
                .setLabel(`${Page}/${TotalData}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('1061272499670745229')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(TotalData === Page),
            new ButtonBuilder()
                .setCustomId('last')
                .setEmoji('1070037622820458617')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(Page === TotalData),
        );
}