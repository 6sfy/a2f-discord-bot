const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unbl')
		.setDescription('Retirer un utilisateur de la blacklist')
		.addUserOption(option =>
			option.setName('utilisateur')
			.setDescription('L\'utilisateur à retirer de la blacklist')
			.setRequired(true)),

	async execute(interaction, client) {
		if (!await client.db.get(`owners_${interaction.user.id}`)) {
			return interaction.reply({
				content: '▸ ❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
				ephemeral: true
			});
		}
		const user = interaction.options.getUser('utilisateur');
		const blacklist = await client.db.get('blacklist') || [];
		if (!blacklist.some(u => u.id === user.id)) {
			return interaction.reply({
				content: `▸ <@${user.id}> n'est pas dans la blacklist.`,
				ephemeral: true
			});
		}
		const updatedBlacklist = blacklist.filter(u => u.id !== user.id);
		await client.db.set('blacklist', updatedBlacklist);
		interaction.reply({
			content: `▸ <@${user.id}> a été retiré de la blacklist.`,
			ephemeral: true
		});
	},
};