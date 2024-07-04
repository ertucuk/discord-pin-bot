const { EmbedBuilder, codeBlock, inlineCode } = require('discord.js');
const pinSchema = require("../../Schema/Pin");
const BetterMarkdown = require('discord-bettermarkdown');
const staffSchema = require("../../Schema/Staff");
const staffFunctions = require("../../Functions/Staff");

module.exports = {
    name: 'stat',
    aliases: ['me', 'pin', 'verilerim'],

    execute: async (client, message, args) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            message.channel.send({ content: `Kullanıcı bulunamadı.` });
            return;
        }

        if (member.user.bot) {
            message.channel.send({ content: `Botlar için bu komut kullanılamaz.` });
            return;
        }

        if (!staffFunctions.checkStaff(member)) return message.channel.send({ content: `${member.id === message.author.id ? 'Yetkili değilsiniz.' : 'Kullanıcı yetkili değil.'}` });

        const document = await pinSchema.findOne({ id: member.id })
        if (!document) {
            message.channel.send({ content: `Kullanıcının verisi bulunmamaktadır.` });
            return;
        }

        const { currentRole, newRole } = staffFunctions.getRole(member.roles.cache.map((r) => r.id));
        const staffDocument = await staffSchema.findOne({ id: member.id });
        if (!staffDocument) {
            currentRole?.ROLE && await new staffSchema({ id: member.id, currentPin: 0, requiredPin: currentRole?.COUNT }).save();
            message.channel.send({ content: `Kullanıcının yetki verisi bulunmamaktadır. Veri oluşturuldu, lütfen tekrar deneyin.` });
            return;
        }

        const pinsCount = document.pin || {};
        const totalPin = Object.keys(pinsCount).reduce((totalCount, currentDay) => totalCount + pinsCount[currentDay].total, 0);
        const weeklyPin = Object.keys(pinsCount).slice(-7).reduce((totalCount, currentDay) => totalCount + pinsCount[currentDay].total, 0);
        const monthlyPin = Object.keys(pinsCount).slice(-30).reduce((totalCount, currentDay) => totalCount + pinsCount[currentDay].total, 0);
        const dailyPin = pinsCount[document.days]?.total || 0;

        const embed = new EmbedBuilder({
            footer: { text: `ertu was here ❤️`, iconURL: member.user.displayAvatarURL({ dynamic: true }) },
            thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
            description: [
                `${member} kullanıcısının pin verileri`,
                `${codeBlock('ansi', '# Genel Bilgiler'.blue.bold)}`,
                `${findEmoji('point')} ${inlineCode(' Toplam Pin Sayısı   :')} ${totalPin} Pin`,
                `${findEmoji('point')} ${inlineCode(' Günlük Pin Sayısı   :')} ${dailyPin} Pin`,
                `${findEmoji('point')} ${inlineCode(' Haftalık Pin Sayısı :')} ${weeklyPin} Pin`,
                `${findEmoji('point')} ${inlineCode(' Aylık Pin Sayısı    :')} ${monthlyPin} Pin`,
                `${findEmoji('point')} ${inlineCode(' Son Pin Tarihi      :')} <t:${Math.floor(document.lastPinDate / 1000)}:R>\n`,
                `${codeBlock('ansi', '# Kanal Bilgileri'.blue.bold)}`,
                `${getTopChannels(document, pinsCount, document.days).channels.map((c) => `${findEmoji('point')} <#${c.id}>: ${inlineCode(c.value + ' Pin')}`).join('\n')}\n`,
                `${codeBlock('ansi', '# Yetkili Bilgileri'.blue.bold)}`,
                `${findEmoji('point')} ${inlineCode(' Mevcut Yetki    :')} ${currentRole ? `<@&${currentRole.ROLE}>` : 'Veri Yok.'}`,
                `${findEmoji('point')} ${inlineCode(' Sonraki Yetki   :')} ${newRole ? `<@&${newRole.ROLE}>` : 'Son Yetkidesiniz.'}`,
                `${findEmoji('point')} ${inlineCode(' Mevcut Pin      :')} ${staffDocument ? staffDocument.currentPin : 'Veri Yok.'}`,
                `${findEmoji('point')} ${inlineCode(' Gereken Pin     :')} ${staffDocument ? staffDocument.requiredPin : 'Veri Yok.'}`,
            ].join('\n'),
        });

        message.channel.send({ embeds: [embed] });
    }
}

function getTopChannels(document, days, day) {
    const channelStats = {};
    let total = 0;
    Object.keys(days)
        .filter((d) => day > document.days - Number(d))
        .forEach((d) =>
            Object.keys(days[d]).forEach((channelId) => {
                if (channelId == 'total') return;
                
                if (!channelStats[channelId]) channelStats[channelId] = 0;
                channelStats[channelId] += days[d][channelId];
                total += days[d][channelId];
            }),
        );
    return {
        channels: Object.keys(channelStats)
            .sort((a, b) => channelStats[b] - channelStats[a])
            .map((c) => ({ id: c, value: channelStats[c] }))
            .slice(0, 5),
        total,
    };
}

function findEmoji(name) {
    return client.emojis.cache.find(e => e.name === name);
}