const client = global.client;
const { Events } = require("discord.js");
const system = require("../System");

client.on(Events.GuildMemberAdd, async (member) => {
    member.roles.add(system.memberRole) 
})