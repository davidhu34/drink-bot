const { updateUserProfile } = require('./api');

let users = {};

module.exports = {
    users,
    updateUser: async function (userId) {
        if (!users[userId]) {
            users[userId] = await updateUserProfile(userId);
        }
    },
    getUserProfile: async function (userId) {
        const profile = users[userId];
        if (profile) {
            return profile;
        } else {
            users[userId] = await updateUserProfile(userId);
            return users[userId];
        }
    },
    getCurrentOrder: (userId) => users[userId].currentOrder || {}
};