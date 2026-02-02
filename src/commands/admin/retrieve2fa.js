const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { generateTOTP, formatSecrets } = require('../../utils/index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retrieve2fa')
        .setDescription('Récupérer la clé 2FA d\'un utilisateur (Admin uniquement)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur dont vous voulez récupérer la clé 2FA')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const apps = await client.db.all().filter(item => item.ID.startsWith(`2fa_${targetUser.id}_`) && !item.ID.endsWith('_password'));

        if (apps.length === 0) {
            return interaction.reply({
                content: `▸ ❌ **${targetUser.tag} n'a pas d'applications 2FA configurées.**`,
                ephemeral: true
            });
        }

        const appOptions = apps.map(app => {
            const appData = JSON.parse(app.data);
            return {
                name: appData.name,
                value: appData.name
            };
        });
        
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('app_select')
                    .setPlaceholder('Sélectionnez une application')
                    .addOptions(appOptions)
            );

        await interaction.reply({
            content: `Veuillez sélectionner l'application 2FA de ${targetUser.tag} dont vous souhaitez récupérer la clé :`,
            components: [row],
            ephemeral: true
        });

        const filter = i => i.customId === 'app_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
            const selectedApp = i.values[0];
            const selectedAppData = apps.find(app => app.name === selectedApp);

            if (!selectedAppData) {
                return i.update({
                    content: `▸ ❌ **Une erreur est survenue lors de la récupération des données pour "${selectedApp}".**`,
                    components: []
                });
            }

            const { secret } = selectedAppData;
            const otpCode = generateTOTP(secret);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Clé 2FA récupérée`)
                .setDescription(`Utilisateur: ${targetUser.tag}\nApplication: ${selectedApp}\nClé secrète: \`${secret}\`\nCode OTP: \`${otpCode}\``)
                .setFooter({ text: 'Cette information est sensible. Utilisez-la avec précaution.' })
                .setTimestamp();

            await i.update({ content: null, embeds: [embed], components: [] });
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '▸ ⏱️ **Le temps de sélection est écoulé. Veuillez réessayer la commande.**',
                    components: []
                });
            }
        });
    },
};
