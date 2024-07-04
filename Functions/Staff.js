const staff = require('../System')

module.exports = class Functions {
    static checkStaff(member) {
        return staff.auths.some((r) => member?.roles.cache.has(r.ROLE))
    }

    static getRole(roles) {
        if (!staff.auths) return { currentRole: undefined, newRole: undefined }

        const sortedRoles = staff.auths.sort()
        const currentIndex = sortedRoles.findIndex((rank) => roles.includes(rank.ROLE))
        return {
            currentRole: sortedRoles[currentIndex] || undefined,
            currentIndex,
            newRole: sortedRoles[currentIndex + 1] || undefined,
            newIndex: currentIndex + 1
        }
    }

    static async checkPinCount(document, count) {
        
        if (!document) return;
        document.currentPin += count
        await document.save()
    }

    static async checkRole(member, document) {

        const { currentRole, newRole } = Functions.getRole(member.roles.cache.map((r) => r.id))
        if (!currentRole || !newRole) return

        if (document.currentPin >= document.requiredPin) {
            await member.roles.add(newRole.ROLE)
            await member.roles.remove(currentRole.ROLE)

            document.currentPin = 0
            document.requiredPin = newRole.COUNT
            await document.save()

            member.send({ content: `Tebrikler! Bir sonraki yetkiye terfi ettiniz. Yeni yetkiniz: **${member.guild.roles.cache.get(newRole.ROLE).name}**` })
        } 
    }
}