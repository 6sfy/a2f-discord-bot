const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Envoyer des informations à un utilisateur (Admin uniquement)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur à qui envoyer le message')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!await client.db.get(`owners_${interaction.user.id}`)) {
            return interaction.reply({
                content: '▸ ❌ **Vous n\'avez pas la permission d\'utiliser cette commande.**',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');

        const modal = new ModalBuilder()
            .setCustomId('sendModal')
            .setTitle('Envoyer un message');

        const titleInput = new TextInputBuilder()
            .setCustomId('titleInput')
            .setLabel("Titre du message")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const contentInput = new TextInputBuilder()
            .setCustomId('contentInput')
            .setLabel("Contenu du message")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const colorInput = new TextInputBuilder()
            .setCustomId('colorInput')
            .setLabel("Couleur de l'embed (hex)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#0099ff')
            .setRequired(false);

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(contentInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(colorInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmission = await interaction.awaitModalSubmit({ time: 300000 });
            let title = modalSubmission.fields.getTextInputValue('titleInput');
            let content = modalSubmission.fields.getTextInputValue('contentInput');
            const color = modalSubmission.fields.getTextInputValue('colorInput') || '#0099ff';

         
            const addEmojis = (text) => {
                const emojiMap = {
                    '2fa': '🔐',
                    'sécurité': '🛡️',
                    'code': '🔢',
                    'authentification': '🔑',
                    'vérification': '✅',
                    'application': '📱',
                    'configuration': '⚙️',
                    'mot de passe': '🔒',
                    'clé': '🗝️',
                    'qr code': '📷',
                    'scanner': '📸',
                    'générer': '🔄',
                    'token': '🎟️',
                    'protection': '🛡️',
                    'compte': '👤',
                    'accès': '🚪',
                    'autorisation': '✔️',
                    'refus': '❌',
                    'temps': '⏱️',
                    'expiration': '⌛',
                    'sauvegarde': '💾',
                    'récupération': '🔍',
                    'urgence': '🚨',
                    'backup': '📂',
                    'synchronisation': '🔄',
                };

                Object.keys(emojiMap).forEach(key => {
                    const regex = new RegExp(`\\b${key}\\b`, 'gi');
                    text = text.replace(regex, `${emojiMap[key]} $&`);
                });

                return text;
            };

            title = addEmojis(title);
            content = addEmojis(content);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(content)
                .setTimestamp()
                .setFooter({ text: `Envoyé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await targetUser.send({ embeds: [embed] });

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Message envoyé avec succès')
                .setDescription(`▸ ✅ **Le message a été envoyé à ${targetUser.tag}.**`)
                .setTimestamp();

            await modalSubmission.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            await interaction.followUp('▸ ❌ **Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.**');
        }
    },
};