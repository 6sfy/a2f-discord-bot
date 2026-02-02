const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetpass')
        .setDescription('Réinitialiser le mot de passe 2FA d\'un utilisateur (Admin uniquement)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez réinitialiser le mot de passe 2FA')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const newPassword = crypto.randomBytes(4).toString('hex');

        await client.db.set(`2fa_password_${targetUser.id}`, newPassword);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Mot de passe 2FA réinitialisé`)
            .setDescription(`Le mot de passe 2FA de ${targetUser.tag} a été réinitialisé.\nNouveau mot de passe: \`${newPassword}\``)
            .setFooter({ text: 'Assurez-vous de communiquer ce nouveau mot de passe à l\'utilisateur de manière sécurisée.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        try {
            await targetUser.send(`Votre mot de passe 2FA a été réinitialisé par un administrateur. Votre nouveau mot de passe est : \`${newPassword}\`. Veuillez le changer dès que possible en utilisant la commande appropriée.`);
        } catch (error) {
            console.error('Impossible d\'envoyer un message privé à l\'utilisateur:', error);
            await interaction.followUp({ content: '▸ ⚠️ **Impossible d\'envoyer un message privé à l\'utilisateur. Assurez-vous de lui communiquer le nouveau mot de passe de manière sécurisée.**', ephemeral: true });
        }
    },
};