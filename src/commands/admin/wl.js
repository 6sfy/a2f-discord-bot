const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wl')
        .setDescription('Ajouter un utilisateur à la whitelist')
        .addUserOption(option =>
            option.setName('utilisateur')
            .setDescription('L\'utilisateur à ajouter à la whitelist')
            .setRequired(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
                ephemeral: true
            });
        }
        const user = interaction.options.getUser('utilisateur');
        const whitelist = await client.db.get(`whitelist_${user.id}`);
        if (whitelist) {
            return interaction.reply({
                content: `▸ <@${user.id}> est déjà dans la whitelist.`,
                ephemeral: true
            });
        }
        await client.db.set(`whitelist_${user.id}`, true);
        interaction.reply({
            content: `▸ <@${user.username}> a été ajouté à la whitelist.`,
            ephemeral: true
        });
    },
};