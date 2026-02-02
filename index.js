const Discord = require("discord.js")
const axios = require("axios")
const fs = require("fs")
const config = require("./config.js")
const client = new Discord.Client({ 
    intents: 53608447,
    presence: {
        activities: [{
            name: `2fa bot`,
            type: Discord.ActivityType.Streaming,
            url: "https://www.twitch.tv/sixfaxeur"
        }],
        status: "dnd"
    }
})
client.config = config;
client.axios = axios;
client.db = new (require("quick.db").QuickDB)()
client.aliases = new Discord.Collection()
client.slashCommands = new Discord.Collection()
client.utils = {
    security: require('./src/utils/security')
}

fs.readdirSync('./src/commands').forEach(dossier => {
	fs.readdirSync(`./src/commands/${dossier}`).filter(file => file.endsWith('.js')).forEach(file => {
		const command = require(`./src/commands/${dossier}/${file}`)
		if (command.data) {
			client.slashCommands.set(command.data.name, command)
		}
	})
})

fs.readdirSync('./src/events').forEach(dossier => {
	fs.readdirSync(`./src/events/${dossier}`).filter(file => file.endsWith('.js')).forEach(file => {
		const event = require(`./src/events/${dossier}/${file}`)
		console.log(`Event chargé: ${file}`)
		if (event.once) {
			client.once(event.name, (...args) => event.execute(client, ...args))
		} else {
			client.on(event.name, (...args) => event.execute(client, ...args))
		}
	})
})

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
	console.error('Uncaught exception:', error);
});

process.on('SIGINT', () => {
	console.log('SIGINT signal received. Shutting down gracefully...');
	client.destroy();
	process.exit(0);
});

client.login(client.config.token)