const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateTOTP } = require('../../utils/index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Afficher toutes vos applications 2FA'),

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
        function dsc(isoDate) {
            const date = new Date(isoDate);
            return `<t:${Math.floor(date.getTime() / 1000)}:d>`;
        }
        userApps.sort((a, b) => new Date(a.date) - new Date(b.date));

        let currentPage = 0;

        const generatePages = () => {
            const pages = [];
            const nextUpdate = Math.floor(Date.now() / 30000) * 30000 + 30000;
            for (let i = 0; i < userApps.length; i += 5) {
                const pageApps = userApps.slice(i, i + 5);
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Vos applications 2FA')
                    .setDescription(pageApps.map((app, index) => {
                        const otpCode = generateTOTP(app.secret);
                        return `🔽 ${i + index + 1}. ${app.name}\n┖ OTP: ${otpCode}\n┖ Date: ${dsc(app.date)}`;
                    }).join('\n\n'))
                    .setFooter({ text: `Page ${pages.length + 1}/${Math.ceil(userApps.length / 5)}` })
                    .addFields({ name: 'Prochain code dans', value: `<t:${Math.floor(nextUpdate / 1000)}:R>` })
                    .setTimestamp();
                pages.push(embed);
            }
            return pages;
        };

        let pages = generatePages();

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('<<')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('>>')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pages.length <= 1)
        );

        const response = await interaction.reply({
            embeds: [pages[currentPage]],
            components: [buttonRow],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", ephemeral: true });
            }

            if (i.customId === 'previous') {
                currentPage = Math.max(0, currentPage - 1);
            } else if (i.customId === 'next') {
                currentPage = Math.min(pages.length - 1, currentPage + 1);
            }

            buttonRow.components[0].setDisabled(currentPage === 0);
            buttonRow.components[1].setDisabled(currentPage === pages.length - 1);

            pages = generatePages();

            await i.update({
                embeds: [pages[currentPage]],
                components: [buttonRow]
            });
        });

        collector.on('end', () => {
            buttonRow.components.forEach(button => button.setDisabled(true));
            interaction.editReply({ components: [buttonRow] });
        });

        const updateInterval = setInterval(() => {
            pages = generatePages();
            interaction.editReply({ embeds: [pages[currentPage]] });
        }, 30000);

        setTimeout(() => {
            clearInterval(updateInterval);
        }, 300000);
    },
};
