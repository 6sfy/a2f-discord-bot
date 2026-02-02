const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listapp')
        .setDescription('Lister les applications 2FA d\'un utilisateur (Admin uniquement)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez lister les applications 2FA')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const apps = await client.db.get(`2fa_${targetUser.id}`) || [];

        if (apps.length === 0) {
            return interaction.reply({
                content: `▸ ℹ️ **${targetUser.tag} n'a pas d'applications 2FA configurées.**`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Applications 2FA de ${targetUser.tag}`)
            .setDescription(apps.map(app => `• ${app.name}`).join('\n'))
            .setFooter({ text: `Total: ${apps.length} application(s)` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
