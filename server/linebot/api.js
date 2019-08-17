const axios = require('axios');
const fs = require('fs');
const ds = require('../datastore');

const { LINE_CHANNEL_ACCESS_TOKEN } = require('../configs');
const {
    LINE_BOT_ROOT_PATH,
    LINE_USER_PROFILE_PATH,
    LINE_RICH_MENU_PATH,
    LINE_RICH_MENU_LIST_PATH,
    LINE_DEFAULT_RICH_MENU_PATH
} = require('../consts');

const AUTHORIZATION = `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`;

const basicErrorMessage = (name,error) => {
    console.log('basic error',error);
    const { data, status, headers } = error.response;
    console.log(`${name} error:\
        headers:${headers}\
        status:${status}\
        data:${data}\
    `);
};

/**
 * User
 */
const getUserProfilePath = (userId) => `${LINE_BOT_ROOT_PATH}${LINE_USER_PROFILE_PATH}/${userId}`;

const fetchUserProfile = (userId) => axios({
    method: 'get',
    url: getUserProfilePath(userId),
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Profile Get',error) );

const updateUserProfile = async (userId) => {
    let profileResponse = await fetchUserProfile(userId);
    const profile = profileResponse.data;
    console.log(profile);
    if (profile.userId) {
        const saveResponse = await ds.saveUserProfile(profile);
        return saveResponse.data;
    } else return profile;
};

/**
 * Rich Menu
 */

const richMenuPath = `${LINE_BOT_ROOT_PATH}${LINE_RICH_MENU_PATH}`;
const richMenuListPath = `${LINE_BOT_ROOT_PATH}${LINE_RICH_MENU_LIST_PATH}`;
const getImagePath = (richMenuId) => `${richMenuPath}/${richMenuId}/content`;
const getDefaultPath = (richMenuId) => `${LINE_BOT_ROOT_PATH}${LINE_DEFAULT_RICH_MENU_PATH}/${richMenuId}`;
const getDeletePath = (richMenuId) => `${richMenuPath}/${richMenuId}`;

const pushRichMenuJson = () => axios({
    method: 'post',
    url: richMenuPath,
    data: require('./rich-menu.json'),
    headers: {
        'Authorization': AUTHORIZATION,
        'Content-Type': 'application/json'
    }
}).catch( error => basicErrorMessage('Rich Menu Push JSON',error) );

const pushRichMenuImage = (richMenuId) => axios({
    method: 'post',
    url: getImagePath(richMenuId),
    data: fs.createReadStream(`${__dirname}/rich-menu.jpg`),
    headers: {
        'Authorization': AUTHORIZATION,
        'Content-Type': 'image/jpeg'
    }
}).catch( error => basicErrorMessage('Rich Menu Push Image',error) );

const updateDefaultRichMenu = (richMenuId) => axios({
    method: 'post',
    url: getDefaultPath(richMenuId),
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Rich Menu Update Default',error) );

const fetchRichMenuList = () => axios({
    method: 'get',
    url: richMenuListPath,
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Rich Menu List',error) );

const deleteRichMenu = (richMenuId) => axios({
    method: 'delete',
    url: getDeletePath(richMenuId),
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Rich Menu Delete',error) );

const deleteExtraRichMenu = async (richMenuId) => {

    const listResponse = await fetchRichMenuList();

    const { richmenus } = listResponse.data;
    const extraRichMenuIdList = [];
    for (let menu of richmenus) {
        if (menu.richMenuId !== richMenuId) {
            extraRichMenuIdList.push(menu.richMenuId);
        }
    }
    
    return Promise.all(extraRichMenuIdList.map(id => deleteRichMenu(id)));
};

module.exports = {
    pushRichMenuJson,
    pushRichMenuImage,
    updateDefaultRichMenu,
    deleteExtraRichMenu,
    updateUserProfile
}
