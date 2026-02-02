const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Sauvegarder ou restaurer vos données 2FA')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer une sauvegarde de vos données'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restore')
                .setDescription('Restaurer vos données à partir d\'une sauvegarde')
                .addStringOption(option =>
                    option.setName('backup')
                        .setDescription('La sauvegarde à restaurer')
                        .setRequired(true))),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const password = await client.db.get(`2fa_password_${interaction.user.id}`);
            if (!password) {
                return interaction.reply({
                    content: '▸ ❌ **Vous devez d\'abord configurer un mot de passe avec la commande /setpassword.**',
                    ephemeral: true
                });
            }

            const passwordModal = new ModalBuilder()
                .setCustomId('backupPasswordModal')
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

                const isValid = await client.utils.security.verifyPassword(submittedPassword, password);
                if (!isValid) {
                    return passwordSubmission.reply({
                        content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                        ephemeral: true
                    });
                }

                const userData = {
                    apps: await client.db.get(`2fa_${interaction.user.id}`) || [],
                    password: password,
                    recoveryCodes: await client.db.get(`recovery_codes_${interaction.user.id}`) || []
                };

                const encryptionKey = crypto.randomBytes(32);
                
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
                
                let encryptedData = cipher.update(JSON.stringify(userData), 'utf8', 'hex');
                encryptedData += cipher.final('hex');
                
                const backup = {
                    data: encryptedData,
                    iv: iv.toString('hex'),
                    key: encryptionKey.toString('hex'),
                    timestamp: new Date().toISOString()
                };
                
                const backups = await client.db.get(`backups_${interaction.user.id}`) || [];
                backups.push(backup);
                await client.db.set(`backups_${interaction.user.id}`, backups);
                
                const backupCode = crypto.randomBytes(4).toString('hex').toUpperCase();
                
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Sauvegarde créée')
                    .setDescription('▸ ✅ **Votre sauvegarde a été créée avec succès.**\n\n' +
                        `**Code de sauvegarde :** \`${backupCode}\`\n` +
                        '**Date :** ' + new Date().toLocaleString())
                    .setFooter({ text: 'Conservez ce code en lieu sûr pour pouvoir restaurer votre sauvegarde.' })
                    .setTimestamp();

                await passwordSubmission.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Erreur lors de la création de la sauvegarde:', error);
                await interaction.followUp('▸ ❌ **Une erreur est survenue lors de la création de la sauvegarde. Veuillez réessayer.**', { ephemeral: true });
            }
        } else if (subcommand === 'restore') {
            const backupCode = interaction.options.getString('backup');
            
            const backups = await client.db.get(`backups_${interaction.user.id}`) || [];
            
            const backup = backups.find(b => b.code === backupCode);
            if (!backup) {
                return interaction.reply({
                    content: '▸ ❌ **Code de sauvegarde invalide.**',
                    ephemeral: true
                });
            }
            
            const passwordModal = new ModalBuilder()
                .setCustomId('restorePasswordModal')
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

                const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(backup.key, 'hex'), Buffer.from(backup.iv, 'hex'));
                
                let decryptedData = decipher.update(backup.data, 'hex', 'utf8');
                decryptedData += decipher.final('utf8');
                
                const userData = JSON.parse(decryptedData);
                
                const isValid = await client.utils.security.verifyPassword(submittedPassword, userData.password);
                if (!isValid) {
                    return passwordSubmission.reply({
                        content: '▸ ❌ **Mot de passe incorrect. Opération annulée.**',
                        ephemeral: true
                    });
                }
                
                await client.db.set(`2fa_${interaction.user.id}`, userData.apps);
                await client.db.set(`2fa_password_${interaction.user.id}`, userData.password);
                await client.db.set(`recovery_codes_${interaction.user.id}`, userData.recoveryCodes);
                
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Données restaurées')
                    .setDescription('▸ ✅ **Vos données ont été restaurées avec succès à partir de la sauvegarde.**')
                    .setFooter({ text: `Date de la sauvegarde : ${new Date(backup.timestamp).toLocaleString()}` })
                    .setTimestamp();

                await passwordSubmission.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                
            } catch (error) {
                console.error('Erreur lors de la restauration:', error);
                await interaction.followUp('▸ ❌ **Une erreur est survenue lors de la restauration. Veuillez réessayer.**', { ephemeral: true });
            }
        }
    },
};
