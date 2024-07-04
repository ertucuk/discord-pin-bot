const { Client, Partials, GatewayIntentBits, Events, EmbedBuilder, ActivityType, Collection, PermissionsBitField } = require('discord.js');
const system = require('./System');
const { readdir } = require('fs');
const { joinVoiceChannel } = require('@discordjs/voice');

const linkCooldowns = new Map();
const reklamCooldowns = new Map();

const client = global.client = new Client({ intents: Object.keys(GatewayIntentBits), partials: Object.keys(Partials) });

const commands = client.commands = new Collection();
const aliases = client.aliases = new Collection();
readdir("./Commands/", (err, files) => {
    if (err) console.error(err)
    files.forEach(f => {
        readdir("./Commands/" + f, (err2, files2) => {
            if (err2) console.log(err2)
            files2.forEach(file => {
                let ertucum = require(`./Commands/${f}/` + file);
                console.log(`[KOMUT] ${ertucum.name} Yüklendi!`);
                commands.set(ertucum.name, ertucum);
                ertucum.aliases.forEach(alias => { aliases.set(alias, ertucum.name); });
            });
        });
    });
});

readdir("./Events/", (err, files) => {
    if (err) console.error(err)
    files.forEach(f => {
        require(`./Events/${f}`);
        console.log(`[EVENT] (${f.replace(".js", "")})`)
    });
});

client.on(Events.MessageCreate, async (message) => {

    const reklamRegex = /discord\.gg\/\w+|discordapp\.com\/invite\/\w+/gi;
    if (reklamRegex.test(message.content) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (!reklamCooldowns.has(message.author.id)) {
            reklamCooldowns.set(message.author.id, 1);
        } else {
            reklamCooldowns.set(message.author.id, reklamCooldowns.get(message.author.id) + 1);
        }

        if (reklamCooldowns.get(message.author.id) >= 5) {
            message.member.timeout(300000);
            reklamCooldowns.delete(message.author.id);
            message.delete();
            message.channel.send(`${message.author} 5 adet reklam yaptığı için 5 dakika susturuldu!`).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
        }

        if (reklamCooldowns.get(message.author.id) <= 5) {
            message.delete();
            message.channel.send(`${message.author}, reklam yapmak yasaktır!`).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
        }
        return;
    }

    const linkRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
    if (linkRegex.test(message.content) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (!linkCooldowns.has(message.author.id)) {
            linkCooldowns.set(message.author.id, 1);
        } else {
            linkCooldowns.set(message.author.id, linkCooldowns.get(message.author.id) + 1);
        }

        if (linkCooldowns.get(message.author.id) >= 5) {
            message.member.timeout(300000);
            linkCooldowns.delete(message.author.id);
            message.delete();
            message.channel.send(`${message.author} 5 adet link paylaştığı için 5 dakika susturuldu!`).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
        }

        if (linkCooldowns.get(message.author.id) <= 5) {
            message.delete();
            message.channel.send(`${message.author}, linkler yasaktır!`).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
        }
        return;
    }

    if (system.prefix && !message.content.startsWith(system.prefix)) return;
    const args = message.content.slice(1).trim().split(/ +/g);
    const commands = args.shift().toLowerCase();
    const cmd = client.commands.get(commands) || [...client.commands.values()].find((e) => e.aliases && e.aliases.includes(commands));
    if (cmd) {
        cmd.execute(client, message, args);
    }
})

client.on(Events.ClientReady, async () => {
    console.log(`[BOT] ${client.user.tag} olarak giriş yaptı!`);
    client.user.setActivity({ name: 'ertu was here ❤️', type: ActivityType.Listening });
    client.user.setStatus('dnd');

    const channel = client.channels.cache.get(system.botVoiceChannelId);

    let vcStatus = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        group: client.user.id,
        selfDeaf: true,
        selfMute: true
    });

    vcStatus.on('error', (err) => {
        console.log(err);
        vcStatus.rejoin();
    });
});

const mongoose = require("mongoose");
mongoose.connect(system.mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log("[BOT] MongoDB bağlandı!")
}).catch((err) => {
    throw err;
});

client.login(system.token);