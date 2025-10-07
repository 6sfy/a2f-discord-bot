const jsSHA = require('jssha');
const paternotp = /^[a-z0-9]{4}( [a-z0-9]{4}){7}$/;
function dec2hex(s) {
    return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

function hex2dec(s) {
    return parseInt(s, 16);
}

function base32tohex(base32) {
    if (!base32) {
        console.error('Erreur: le secret est indéfini ou nul');
        return '';
    }
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";

    for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 4 <= bits.length; i += 4) {
        const chunk = bits.substr(i, 4);
        hex += parseInt(chunk, 2).toString(16);
    }

    return hex;
}

function generateTOTP(secret, epoch) {
    const key = base32tohex(secret);

    if (key.length % 2 !== 0) {
        key += '0';
    }

    if (typeof epoch === 'undefined') {
        epoch = Math.round(new Date().getTime() / 1000.0);
    }
    const time = dec2hex(Math.floor(epoch / 30)).padStart(16, '0');

    const shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    const hmac = shaObj.getHMAC("HEX");

    const offset = hex2dec(hmac.substring(hmac.length - 1));
    const otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) % 1000000 + '';
    return otp.padStart(6, '0');
}

function formatSecret(secret) {
    if (isBase32(secret)) {
        return secret;
    }
    return secret.replace(/\s+/g, '').toUpperCase();
}

function isBase32(secret) {
    const base32Regex = /^[A-Z2-7]+=*$/;
    return base32Regex.test(secret);
}

module.exports = {
    generateTOTP,
    formatSecret
};

