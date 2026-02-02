const crypto = require('crypto');
const bcrypt = require('bcrypt');

function generateRecoveryCode() {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(generateRecoveryCode());
    }
    return codes;
}

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function isValidRecoveryCode(code, recoveryCodes) {
    return recoveryCodes.includes(code);
}

function markRecoveryCodeAsUsed(code, recoveryCodes) {
    const index = recoveryCodes.indexOf(code);
    if (index !== -1) {
        recoveryCodes.splice(index, 1);
        return true;
    }
    return false;
}

module.exports = {
    generateRecoveryCode,
    generateRecoveryCodes,
    hashPassword,
    verifyPassword,
    generateSessionToken,
    isValidRecoveryCode,
    markRecoveryCodeAsUsed
};
