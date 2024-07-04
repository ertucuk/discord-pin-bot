const { EmbedBuilder, PermissionsBitField, bold } = require('discord.js');
const system = require("../../System");

module.exports = {
    name: "setup",
    aliases: [],

    execute: async (client, message, args) => {

        if (!system.botOwners.includes(message.author.id)) return;

        const emojis = [
            { name: "point", url: "https://cdn.discordapp.com/emojis/1057358625972178974.webp?size=40&quality=lossless" },
        ]

        emojis.forEach(emoji => {
            const findEmoji = client.emojis.cache.find(e => e.name === emoji.name);
            if (findEmoji) return;
            
            message.guild.emojis.create(emoji.url, emoji.name).then(emoji => { message.channel.send({ content: `${bold(emoji.name)} adlı emoji sunucuya eklendi!` }) })
        });
    }
}