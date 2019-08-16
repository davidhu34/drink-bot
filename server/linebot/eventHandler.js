const qs = require('querystring');

const {
    CARTS
} = require('./testData.js');

const handleEvent = (event) => {
    switch (event.type) {
        case 'message':
            return handleMessageEvent(event);
        case 'postback':
            return handlePostbackEvent(event);
        default:
            return null;
    }
}

module.exports = (client) => async function (event) {
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

async function handleMessageEvent(event) {

    const { source, message, replyToken } = event;
    console.log('message event:');
    console.log(source, message);
    
    const viewCarts = cartCarousel(event, CARTS.filter(a => a.from === 'U7f3c8865af6bc3c0c4161bbb13b90d0c'));
    const replyData = viewCarts;
    return { replyToken, replyData };
}


async function getRichMenuReply(postback) {
    const { data, param, source } = postback
    const { index } = data;
    const cartFilter
        = index == 0? a => a.from === source.userId
        : index == 1? a => a.from !== source.userId
        : a => a;

    const viewCarts = cartCarousel(source, CARTS.filter(cartFilter));
    return viewCarts;
}
function getPostbackReply(postback) {
    const { action } = postback.data;
    switch (action) {
        case 'RICH_MENU':
            return getRichMenuReply(postback);
        default:
            return echoText(action);
    }
}
async function handlePostbackEvent(event) {

    const { source, postback, replyToken } = event;
    
    const data = qs.parse(postback.data);
    const param = postback.param;
    console.log('postback event:');
    console.log(postback);
    
    const replyData = await getPostbackReply({ data, param, source });
    return { replyToken, replyData };
}


const cartCarouselCol = (source,cart) => {
    const mine = source.userId === cart.from;
    const ownerName = 'sadff';
    const actions = [
        messageAction('看菜單'),
        messageAction(mine? '幫自己訂一杯': '跟著一起訂'),
    ];

    if (mine) {
        actions.push(messageAction('結單'));
    }

    const desc = `預計 ${cart.expiration} 結單`;
    return carouselCol(desc, actions, {
        title:`${cart.shop}(${ownerName})`
    });
}
const cartCarousel = (source,carts) => {
    console.log(carts);
    const columns = carts.map(cart => cartCarouselCol(source,cart));
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

const postbackAction = (label,data) => ({
    type: 'postback',
    label,
    data,
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