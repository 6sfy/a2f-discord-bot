const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unwl')
		.setDescription('Retirer un utilisateur de la whitelist')
		.addUserOption(option =>
			option.setName('utilisateur')
			.setDescription('L\'utilisateur à retirer de la whitelist')
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
		if (!whitelist) {
			return interaction.reply({
				content: `▸ <@${user.id}> n'est pas dans la whitelist.`,
				ephemeral: true
			});
		}
		await client.db.delete(`whitelist_${user.id}`);
		interaction.reply({
			content: `▸ <@${user.id}> a été retiré de la whitelist.`,
			ephemeral: true
		});
	},
};