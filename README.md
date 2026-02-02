<h1 align="center">
 🔐 〢 Bot 2FA Discord
</h1>

---
## <a id="menu"></a>📋 〢 Menu

- [📌・À propos](#about)
- [⚙️・Configuration](#setup)
- [🛠️・Commandes](#commands)
- [💼・Conditions d'utilisation](#terms)
- [🕵️‍♂️・Auteur](#authors)
- [❓・Besoin d'aide ?](#help)

## <a id="about"></a>📌 〢 À propos

Ce bot 2FA Discord offre une solution pratique pour gérer vos authentifications à deux facteurs directement depuis Discord. Il est compatible non seulement avec Discord, mais aussi avec une variété d'autres sites web et applications qui utilisent l'authentification TOTP (Time-based One-Time Password).

## <a id="setup"></a> 📁 〢 Configuration

1. Installez [Node.js](https://nodejs.org/)
2. Clonez ce dépôt
3. Exécutez `npm install` pour installer les dépendances
4. Configurez le bot (token du bot, etc.)
5. Lancez le bot avec `node index.js`

## <a id="commands"></a> 🛠️ 〢 Commandes

### Commandes utilisateur

- `/setup` : Configurez une nouvelle application 2FA avec une clé ou un qrcode
- `/get` : Récupérez un code OTP pour une application 2FA spécifique
- `/list` : Affichez toutes vos applications 2FA
- `/remove` : Supprimez une application 2FA
- `/clear` : Effacez toutes vos applications 2FA
- `/setpassword` : Créez ou modifiez le mot de passe pour la configuration 2FA
- `/deletealldata` : Supprimez toutes vos données 2FA du bot
- `/recovery` : Gérez vos codes de récupération
  - `generate` : Générez de nouveaux codes de récupération
  - `use` : Utilisez un code de récupération
- `/backup` : Sauvegardez ou restaurez vos données 2FA
  - `create` : Créez une sauvegarde de vos données
  - `restore` : Restaurez vos données à partir d'une sauvegarde

### Commandes administrateur

- `/listapp` : Listez les applications 2FA d'un utilisateur
- `/resetpass` : Réinitialisez le mot de passe 2FA d'un utilisateur
- `/retrieve2fa` : Récupérez la clé 2FA d'un utilisateur
- `/owner` : Gérer les owners du bot
  - `add` : Ajouter un utilisateur en tant que owners
  - `remove` : Retirer un utilisateur en tant que owners
  - `list` : Afficher la liste des owners
- `/send` : Envoyer des informations à un utilisateur
- `/wl` : Ajouter un utilisateur à la whitelist
- `/unwl` : Retirer un utilisateur de la whitelist
- `/bl` : Ajouter un utilisateur à la blacklist
- `/unbl` : Retirer un utilisateur de la blacklist

### <a id="terms"></a>💼 〢 Terms Of Usage

- [x] Educational purpose only.
- [x] You can use the source code if you keep credits (in embed + in markdown), it has to be open-source.
- [x] I am NOT responsible of anything you do with this software (if its illegal).

### <a id="authors"></a>🕵️‍♂️ 〢 Authors
- [Sixfy](https://github.com/6sfy)

## <a id="help"></a>❓ 〢 Besoin d'aide ?

Si vous avez besoin d'aide pour configurer ou utiliser le bot, n'hésitez pas à ouvrir une issue ou à me contacter directement sur Discord : qorp

---
