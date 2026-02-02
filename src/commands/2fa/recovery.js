const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { generateRecoveryCodes, hashPassword, verifyPassword } = require('../../utils/security');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recovery')
        .setDescription('Gérer vos codes de récupération 2FA')
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('Générer de nouveaux codes de récupération'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('use')
                .setDescription('Utiliser un code de récupération')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Le code de récupération à utiliser')
                        .setRequired(true))),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'generate') {
            const password = await client.db.get(`2fa_password_${interaction.user.id}`);
            if (!password) {
                return interaction.reply({
                    content: '▸ ❌ **Vous devez d\'abord configurer un mot de passe avec la commande /setpassword.**',
                    ephemeral: true
                });
            }

            const passwordModal = new ModalBuilder()
                .setCustomId('recoveryPasswordModal')
                .setTitle('Vérification du mot de passe');

            const passwordInput = new TextInputBuilder()
                .setCustomId('passwordInput')
                .setLabel("Entrez votre mot de passe")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const passwordRow = new ActionRowBuilder().addComponents(passwordInput);
            passwordModal.addComponents(passwordRow);

            await interaction.showModal(passwordModal);

            try {
                const passwordSubmission = await interaction.awaitModalSubmit({ time: 60000 });
                const submittedPassword = passwordSubmission.fields.getTextInputValue('passwordInput');

                const isValid = await verifyPassword(submittedPassword, password);
                if (!isValid) {
                    return passwordSubmission.reply({
                        content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                        ephemeral: true
                    });
                }

                const recoveryCodes = generateRecoveryCodes();
                
                const hashedCodes = await Promise.all(recoveryCodes.map(code => hashPassword(code)));
                
                await client.db.set(`recovery_codes_${interaction.user.id}`, hashedCodes);
                
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Codes de récupération générés')
                    .setDescription('▸ ✅ **Vos nouveaux codes de récupération ont été générés. Stockez-les en lieu sûr !**\n\n' + 
                        recoveryCodes.map((code, index) => `${index + 1}. \`${code}\``).join('\n'))
                    .setFooter({ text: 'Ces codes ne seront plus affichés. Utilisez-les en cas de perte de mot de passe.' })
                    .setTimestamp();

                const confirmButton = new ButtonBuilder()
                    .setCustomId('confirmRecoveryCodes')
                    .setLabel('J\'ai sauvegardé mes codes')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);

                const row = new ActionRowBuilder().addComponents(confirmButton);

                await passwordSubmission.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });

                setTimeout(() => {
                    confirmButton.setDisabled(false);
                    passwordSubmission.editReply({ components: [row] });
                }, 10000);

            } catch (error) {
                console.error('Erreur lors de la génération des codes de récupération:', error);
                await interaction.followUp('▸ ❌ **Une erreur est survenue lors de la génération des codes de récupération. Veuillez réessayer.**', { ephemeral: true });
            }
        } else if (subcommand === 'use') {
            const recoveryCode = interaction.options.getString('code');
            const hashedCodes = await client.db.get(`recovery_codes_${interaction.user.id}`) || [];
            
            let isValid = false;
            for (const hashedCode of hashedCodes) {
                const isValidCode = await verifyPassword(recoveryCode, hashedCode);
                if (isValidCode) {
                    isValid = true;
                    break;
                }
            }

            if (!isValid) {
                return interaction.reply({
                    content: '▸ ❌ **Code de récupération invalide.**',
                    ephemeral: true
                });
            }

            const updatedCodes = hashedCodes.filter(async (hashedCode) => {
                return !(await verifyPassword(recoveryCode, hashedCode));
            });
            
            await client.db.set(`recovery_codes_${interaction.user.id}`, updatedCodes);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Code de récupération utilisé')
                .setDescription('▸ ✅ **Votre code de récupération a été utilisé avec succès.**')
                .setFooter({ text: `Il vous reste ${updatedCodes.length} code(s) de récupération.` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
