const { REST, Routes } = require('discord.js');

module.exports = {
	name: "clientReady",
	once: true,
	async execute(client) {
		console.log(`${client.user.tag} est en ligne`)
		const owners = Array.isArray(client.config.owners) ? client.config.owners : [client.config.owners];

		for (const ownerId of owners) {
			await client.db.set(`owners_${ownerId}`, true);
		}
		const rest = new REST({
			version: '10'
		}).setToken(client.token);
		try {
			await rest.put(
				Routes.applicationCommands(client.user.id), {
					body: client.slashCommands.map(command => command.data.toJSON())
				},
			)
		} catch (error) {
			console.error('Erreur lors du chargement des slash commands:', error)
		}
	}
}