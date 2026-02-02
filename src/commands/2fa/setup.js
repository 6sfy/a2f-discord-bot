const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { generateTOTP, formatSecret } = require('../../utils/index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configurer une nouvelle application 2FA')
        .addSubcommand(subcommand =>
            subcommand
                .setName('qrcode')
                .setDescription('Configurer 2FA avec un QR code')
                .addAttachmentOption(option =>
                    option.setName('qrcode')
                        .setDescription('Le QR code à scanner')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('key')
                .setDescription('Configurer 2FA avec une clé')
                .addStringOption(option =>
                    option.setName('key')
                        .setDescription('La clé secrète')
                        .setRequired(true))),

    async execute(interaction, client) {
        if (!await client.db.get(`whitelist_${interaction.user.id}`) && !await client.db.get(`owners_${interaction.user.id}`)) {
            await interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
            return;
        }

        const existingPassword = await client.db.get(`2fa_password_${interaction.user.id}`);
        if (!existingPassword) {
            await interaction.reply({
                content: '▸ ❌ **Vous devez d\'abord configurer un mot de passe avec la commande /setpassword.**',
                ephemeral: true
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        let secret, suggestedAppName;

        if (subcommand === 'qrcode') {
            const qrCodeAttachment = interaction.options.getAttachment('qrcode');
            
            try {
                const response = await client.axios.get(`https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(qrCodeAttachment.url)}`);
                
                if (response.data && response.data[0] && response.data[0].symbol && response.data[0].symbol[0] && response.data[0].symbol[0].data) {
                    const qrCodeData = response.data[0].symbol[0].data;
                    const match = qrCodeData.match(/otpauth:\/\/totp\/([^?]+)\?secret=([^&]+)/);
                    if (!match) {
                        await interaction.reply('▸ ❌ **QR code invalide. Veuillez fournir un QR code 2FA valide.**');
                        return;
                    }

                    suggestedAppName = decodeURIComponent(match[1]);
                    secret = match[2];
                    secret = formatSecret(secret);
                    console.log(`Secret extrait du QR code: ${secret}`);
                } else {
                    await interaction.reply('▸ ❌ **Impossible de lire le QR code. Veuillez vérifier l\'image et réessayer.**');
                    return;
                }
            } catch (error) {
                console.error('Erreur lors de l\'analyse du QR code:', error);
                await interaction.reply('▸ ❌ **Une erreur est survenue lors de l\'analyse du QR code.**');
                return;
            }
        } else if (subcommand === 'key') {
            secret = interaction.options.getString('key');
            secret = formatSecret(secret);
            suggestedAppName = 'Application 2FA';
            const token = generateTOTP(secret);
            if (!token) {
                await interaction.reply('▸ ❌ **Clé secrète invalide. Veuillez vérifier et réessayer.**');
                return;
            }
        }

        if (!secret) {
            console.error('Erreur: le secret est indéfini avant la sauvegarde');
            await interaction.reply('▸ ❌ **Erreur: le secret est indéfini. Veuillez réessayer.**');
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('setupModal')
            .setTitle('Configuration de l\'application 2FA');

        const nameInput = new TextInputBuilder()
            .setCustomId('nameInput')
            .setLabel("Nom de l'application")
            .setStyle(TextInputStyle.Short)
            .setValue(suggestedAppName)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmission = await interaction.awaitModalSubmit({ time: 60000 });
            const appName = modalSubmission.fields.getTextInputValue('nameInput');

            let User = await client.db.get(`2fa_${interaction.user.id}`) || [];
            
            const existingApp = User.find(app => app.name.toLowerCase() === appName.toLowerCase());
            if (existingApp) {
                await modalSubmission.reply({
                    content: `▸ ❌ **Une application nommée "${appName}" existe déjà. Veuillez choisir un autre nom.**`,
                    ephemeral: true
                });
                return;
            }

            const newApp = {
                secret: secret,
                name: appName,
                date: new Date().toISOString()
            };

            User.push(newApp);
            await client.db.set(`2fa_${interaction.user.id}`, User);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Configuration 2FA réussie')
                .setDescription(`▸ ✅ **L'application 2FA "${appName}" a été configurée avec succès.**`)
                .setTimestamp();

            const otpCode = generateTOTP(secret);

            await modalSubmission.reply({ 
                embeds: [successEmbed],
                content: `▸ 🔑 **Votre code OTP pour "${appName}" est :** \`${otpCode}\``,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur lors de la soumission du modal:', error);
            if (!interaction.replied) {
                await interaction.followUp({
                    content: '▸ ❌ **Une erreur est survenue lors de la configuration. Veuillez réessayer.**',
                    ephemeral: true
                });
            }
        }
    },
};
