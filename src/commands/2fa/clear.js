const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Effacer toutes vos applications 2FA'),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const password = await client.db.get(`2fa_password_${interaction.user.id}`);

        if (!password) {
            return interaction.reply({
                content: '▸ ❌ **Vous devez d\'abord configurer un mot de passe avec la commande /setup.**',
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('clearModal')
            .setTitle('Confirmation de suppression');

        const passwordInput = new TextInputBuilder()
            .setCustomId('passwordInput')
            .setLabel("Entrez votre mot de passe")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(passwordInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmission = await interaction.awaitModalSubmit({ time: 60000 });
            const submittedPassword = modalSubmission.fields.getTextInputValue('passwordInput');

            if (submittedPassword !== password) {
                await modalSubmission.reply({
                    content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                    ephemeral: true
                }).catch(console.error);
                return;
            }

            await client.db.delete(`2fa_${interaction.user.id}`);

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Suppression réussie')
                .setDescription(`▸ ✅ **Toutes vos applications 2FA ont été supprimées avec succès.**`)
                .setTimestamp();

            await modalSubmission.reply({ embeds: [successEmbed], ephemeral: true }).catch(async (error) => {
                console.error('Erreur lors de la réponse au modal:', error);
                if (error.code === 10062) {
                    await interaction.followUp({
                        content: '▸ ✅ **Toutes vos applications 2FA ont été supprimées avec succès.**',
                        ephemeral: true
                    }).catch(console.error);
                }
            });
        } catch (error) {
            console.error('Erreur lors de la soumission du modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '▸ ❌ **Une erreur est survenue lors de la suppression. Veuillez réessayer.**',
                    ephemeral: true
                }).catch(console.error);
            } else {
                await interaction.followUp({
                    content: '▸ ❌ **Une erreur est survenue lors de la suppression. Veuillez réessayer.**',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    },
};
