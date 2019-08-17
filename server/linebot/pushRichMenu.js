const {
    pushRichMenuJson,
    pushRichMenuImage,
    updateDefaultRichMenu,
    deleteExtraRichMenu
} = require('./api');

const updateRichMenu = async function () {
    const jsonResponse = await pushRichMenuJson();
    const richMenuId = jsonResponse.data.richMenuId;

    const imageResponse = await pushRichMenuImage(richMenuId);

    const updateResponse = await updateDefaultRichMenu(richMenuId);

    const deleteResponseList = await deleteExtraRichMenu(richMenuId);

    return richMenuId;
}

updateRichMenu().then( menuId => console.log('Updated Rich Menu', menuId) );