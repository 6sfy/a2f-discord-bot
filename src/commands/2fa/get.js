const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateTOTP } = require('../../utils/index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get')
        .setDescription('Récupérer un code OTP pour une application 2FA spécifique')
        .addStringOption(option =>
            option.setName('application')
                .setDescription('Le nom de l\'application 2FA')
                .setRequired(true)
                .setAutocomplete(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const userApps = await client.db.get(`2fa_${interaction.user.id}`) || [];
        
        if (userApps.length === 0) {
            return interaction.reply({
                content: '▸ ℹ️ **Vous n\'avez aucune application 2FA configurée.**',
                ephemeral: true
            });
        }

        const appName = interaction.options.getString('application');
        const app = userApps.find(a => a.name.toLowerCase() === appName.toLowerCase());

        if (!app) {
            return interaction.reply({
                content: `▸ ❌ **L'application "${appName}" n'a pas été trouvée dans vos applications 2FA.**`,
                ephemeral: true
            });
        }

        const otpCode = generateTOTP(app.secret);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Code OTP pour ${app.name}`)
            .setDescription(`▸ 🔑 **Votre code OTP est : \`${otpCode}\`**`)
            .setFooter({ text: 'Ce code est valide pour 30 secondes.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async autocomplete(interaction, client) {
        const userApps = await client.db.get(`2fa_${interaction.user.id}`) || [];
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = userApps
            .filter(app => app.name.toLowerCase().startsWith(focusedValue))
            .slice(0, 25);

        await interaction.respond(
            filtered.map(app => ({ name: app.name, value: app.name }))
        );
    },
};
