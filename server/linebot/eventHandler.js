const qs = require('querystring');
const ds = require('../datastore');
const {
    updateUserProfile
} = require('./api');

const {
    CARTS
} = require('./testData.js');

function handleEvent(event) {
    switch (event.type) {
        case 'message':
            return handleMessageEvent(event);
        case 'postback':
            return handlePostbackEvent(event);
        default:
            return null;
    }
};

let users = {};

module.exports = (client) => async function (event) {
console.log('users', users);
    const result = await handleEvent(event);
    
    if (result) {
        const { replyToken, replyData } = result;
        console.log(replyData);
        return client
            .replyMessage(replyToken,replyData)
            .catch(error => {
                const { statusCode, statusMessage } = error;
                console.log('reply failed', statusCode, statusMessage);
            });
    } else return Promise.resolve(null);
}

async function updateUser(userId) {
    if (!users[userId]) {
        users[userId] = await updateUserProfile(userId);
    }
}

async function handleMessageEvent(event) {

    const { source, message, replyToken } = event;
    console.log('message event:');
    console.log(source, message);
    
    await updateUser(source.userId);
    console.log('users',users);
    const viewCarts = cartCarousel(event, CARTS.filter(a => a.userId === 'U7f3c8865af6bc3c0c4161bbb13b90d0c'));
    const replyData = viewCarts;
    return { replyToken, replyData };
}


const getRichMenuReply = async (postback) => {
    const { data, param, source } = postback
    const { index } = data;
    const cartFilter
        = index == 0? a => a.userId === source.userId
        : index == 1? a => a.userId !== source.userId
        : a => a;

    const viewCarts = cartCarousel(source, CARTS.filter(cartFilter));
    return viewCarts;
};

function getPostbackReply(postback) {
    const { action } = postback.data;
    switch (action) {
        case 'RICH_MENU':
            return getRichMenuReply(postback);
        default:
            return echoText(action);
    }
};

async function handlePostbackEvent(event) {

    const { source, postback, replyToken } = event;
    
    const data = qs.parse(postback.data);
    const param = postback.param;
    console.log('postback event:');
    console.log(source,postback);
    
    await updateUser(source.userId);
    console.log('users',users);

    const replyData = await getPostbackReply({ data, param, source });
    return { replyToken, replyData };
}


const getShop = (shopId) => ds.getShopById(shopId);

const getSeeMenuPostback = async (shopId) => {
    const shop = await getShop(shopId);
    console.log(shop);
    return shop
        ? postbackAction('看菜單', qs.stringify({
            action: 'SEE_MENU',
            shopId
        }), {
            displayText: `看${shop.name}(${shop.branch})菜單`
        })
        : null;
};

const getOrderDrinkPostback = () => {}

const cartCarouselCol = async (source,cart) => {
    const ownerId = cart.userId
    const mine = source.userId === ownerId;
    console.log('cart owner', ownerId);
    const ownerName = users[ownerId].displayName;
    
    const actions = [];
    
    // 看菜單
    const seeMenu = await getSeeMenuPostback(cart.shopId);
    if (seeMenu) actions.push(seeMenu);
    
    // 跟單
    actions.push(messageAction(mine? '幫自己訂一杯': '跟著一起訂'));

    // 結單
    if (mine) {
        actions.push(messageAction('結單'));
    }

    const desc = `預計 ${cart.expiration} 結單`;

    return carouselCol(desc, actions, {
        title:`${cart.shopId}(${ownerName})`
    });
}

const cartCarousel = async (source,carts) => {
    console.log(carts);
    const columns = await Promise.all(
        carts.map(cart => cartCarouselCol(source,cart))
    );
    return carousel(columns, '目前訂單');
}

const echoText = (text) => ({
    type: 'text', text
});

const carouselCol = (text,actions,config) => ({
    text, actions, ...config
});

const carousel = (columns, altText) => ({
    type: 'template',
    altText,
    template: {
        type: 'carousel',
        columns
    }
});

const imageCarouselCol = (imageUrl,action) => ({
    imageUrl, action
});

const imageCarousel = (columns,altText) => ({
    type: 'template',
    altText,
    template: {
        type: 'image_carousel',
        columns
    }
});

const postbackAction = (label, data, config = {}) => ({
    type: 'postback',
    label,
    data,
    ...config
});

const uriAction = (label,uri) => ({
    type: 'uri',
    label,
    uri,
});

const messageAction = (label,text = '') => ({
    type: 'message',
    label,
    text: text || label,
});