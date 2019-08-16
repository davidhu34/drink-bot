const axios = require('axios');
const fs = require('fs');

const { LINE_CHANNEL_ACCESS_TOKEN } = require('../configs');

const basicErrorMessage = (name,error) => {
    const { data, status, headers } = error.response;
    console.log(`${name} error:\
        headers:${headers}\
        status:${status}\
        data:${data}\
    `);
};

const {
    LINE_BOT_ROOT_PATH,
    LINE_RICH_MENU_PATH,
    LINE_RICH_MENU_LIST_PATH,
    LINE_DEFAULT_RICH_MENU_PATH
} = require('../consts');

const richMenuPath = `${LINE_BOT_ROOT_PATH}${LINE_RICH_MENU_PATH}`;
const richMenuListPath = `${LINE_BOT_ROOT_PATH}${LINE_RICH_MENU_LIST_PATH}`;
const getImagePath = (richMenuId) => `${richMenuPath}/${richMenuId}/content`;
const getDefaultPath = (richMenuId) => `${LINE_BOT_ROOT_PATH}${LINE_DEFAULT_RICH_MENU_PATH}/${richMenuId}`;
const getDeletePath = (richMenuId) => `${richMenuPath}/${richMenuId}`;

const AUTHORIZATION = `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`;

const pushRichMenuJson = () => axios({
    method: 'post',
    url: richMenuPath,
    data: require('./rich-menu.json'),
    headers: {
        'Authorization': AUTHORIZATION,
        'Content-Type': 'application/json'
    }
}).catch( error => basicErrorMessage('Push JSON',error) );

const pushRichMenuImage = (richMenuId) => axios({
    method: 'post',
    url: getImagePath(richMenuId),
    data: fs.createReadStream(`${__dirname}/rich-menu.jpg`),
    headers: {
        'Authorization': AUTHORIZATION,
        'Content-Type': 'image/jpeg'
    }
}).catch( error => basicErrorMessage('Push Image',error) );

const updateDefaultRichMenu = (richMenuId) => axios({
    method: 'post',
    url: getDefaultPath(richMenuId),
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Update Default',error) );

const getRichMenuList = () => axios({
    method: 'get',
    url: richMenuListPath,
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('List',error) );

const deleteRichMenu = (richMenuId) => axios({
    method: 'delete',
    url: getDeletePath(richMenuId),
    headers: {
        'Authorization': AUTHORIZATION,
    }
}).catch( error => basicErrorMessage('Delete',error) );

const deleteExtraRichMenu = async function (richMenuId) {

    const listResponse = await getRichMenuList();

    const { richmenus } = listResponse.data;
    const extraRichMenuIdList = [];
    for (let menu of richmenus) {
        if (menu.richMenuId !== richMenuId) {
            extraRichMenuIdList.push(menu.richMenuId);
        }
    }
    
    return Promise.all(extraRichMenuIdList.map(id => deleteRichMenu(id)));
};

const updateRichMenu = async function () {
    const jsonResponse = await pushRichMenuJson();
    const richMenuId = jsonResponse.data.richMenuId;

    const imageResponse = await pushRichMenuImage(richMenuId);

    const updateResponse = await updateDefaultRichMenu(richMenuId);

    const deleteResponseList = await deleteExtraRichMenu(richMenuId);

    return richMenuId;
}

updateRichMenu().then( menuId => console.log('Updated Rich Menu', menuId) );