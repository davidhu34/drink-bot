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

async function getUserProfile(userId) {
    return users[userId] || await updateUserProfile(userId);
}

async function handleMessageEvent(event) {

    const { source, message, replyToken } = event;
    console.log('message event:');
    console.log(source, message);
    
    await getUserProfile(source.userId);
    console.log('users',users);
    const viewCarts = cartCarousel(event, CARTS.filter(a => a.userId === 'U7f3c8865af6bc3c0c4161bbb13b90d0c'));
    const replyData = viewCarts;
    return { replyToken, replyData };
}


const getRichMenuReply = async ({ data, param, source }) => {
    const { index } = data;
    const cartFilter
        = index == 0? a => a.userId === source.userId
        : index == 1? a => a.userId !== source.userId
        : a => a;

    const viewCarts = cartCarousel(source, CARTS.filter(cartFilter));
    return viewCarts;
};

const getShopMenuReply = async ({ data, param, source }) => {
    const shop = await getShop(data.shopId);
    return shop.menuUrls.map( url => imageAction(url));
};

function getPostbackReply(postback) {
    const { action } = postback.data;
    switch (action) {
        case 'RICH_MENU':
            return getRichMenuReply(postback);
        case 'SEE_MENU':
            return getShopMenuReply(postback);
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
    
    await getUserProfile(source.userId);
    console.log('users',users);

    const replyData = await getPostbackReply({ data, param, source });
    return { replyToken, replyData };
}


const getShop = (shopId) => ds.getShopById(shopId);

const getSeeMenuPostback = (shop) => {
    const data = qs.stringify({
            action: 'SEE_MENU',
        shopId: shop.shopId
    });
    const config = {
            displayText: `看${shop.name}(${shop.branch})菜單`
    };

    return postbackAction('看菜單', data, config);
};

const getOrderDrinkPostback = () => {};

const cartCarouselCol = async (source,cart) => {
    const ownerId = cart.userId
    const mine = source.userId === ownerId;
    console.log('cart owner', ownerId);
    const [owner, shop] = await Promise.all([
        getUserProfile(ownerId),
        getShop(cart.shopId)
    ]);
    const actions = [];
    
    // 看菜單
    if (shop.menuUrls.length) {
        actions.push(getSeeMenuPostback(shop));
    }
    
    // 跟單
    actions.push(messageAction(mine? '幫自己訂一杯': '跟著一起訂'));

    // 結單
    if (mine) {
        actions.push(messageAction('結單'));
    }

    const desc = `預計 ${cart.expiration} 結單`;

    return carouselCol(desc, actions, {
        title:`${shop.shopId}(${owner.displayName})`,
        thumbnailImageUrl: shop.logoUrl
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

const imageAction = (url) => ({
    type: 'image',
    originalContentUrl: url,
    previewImageUrl: url
});