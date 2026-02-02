const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bl')
		.setDescription('Ajouter un utilisateur à la blacklist')
		.addUserOption(option =>
			option.setName('utilisateur')
			.setDescription('L\'utilisateur à ajouter à la blacklist')
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
		if (blacklist.some(u => u.id === user.id)) {
			return interaction.reply({
				content: `▸ <@${user.id}> est déjà dans la blacklist.`,
				ephemeral: true
			});
		}
		blacklist.push({
			id: user.id
		});
		await client.db.set('blacklist', blacklist);
		interaction.reply({
			content: `▸ <@${user.id}> a été ajouté à la blacklist.`,
			ephemeral: true
		});
	},
};