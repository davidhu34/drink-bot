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
    const profile = users[userId];
    if (profile) {
        return profile;
    } else {
        users[userId] = await updateUserProfile(userId);
        return users[userId];
    }
}



const sizeDescList = ['大','中','小'];
const iceDescList = ['正常', '少冰', '半冰', '微冰', '去冰'];
const sugarDescList = ['正常', '少糖', '半糖', '微糖', '無糖'];

const orderInfoReply = (msg, descList) => ({
    ...textMessage(msg),
    quickReply: quickReply(
        descList.map(desc => messageAction(desc))
    )
});

const confirmOrderReply = ({ userId }) => {
    const { item } = users[userId].currentOrder;
    const { name, size, ice, sugar } = item;
    users[userId].currentOrder = null;
    return textMessage(`確認: ${name} ${size} ${ice} ${sugar}`);
};
const fillOrder = (filling, { source, message }) => {
    const { time, item } = users[source.userId].currentOrder;
    const order = {
        time,
        item: {
            ...item,
            [filling]: message.text
        }
    };
    users[source.userId].currentOrder = order;
    return order
};

async function handleOrder (orderItem,event) {
    let reply = null;
    if (!orderItem.name) {
        fillOrder('name',event);
        reply = orderInfoReply('什麼大小?', sizeDescList);
    } else if (!orderItem.size) {
        fillOrder('size',event);
        reply = orderInfoReply('冰塊怎麼調整?', iceDescList);
    } else if (!orderItem.ice) {
        fillOrder('ice',event);
        reply = orderInfoReply('甜度怎麼調整?', sugarDescList);
    } else if (!orderItem.suger) {
        fillOrder('sugar',event);
        reply = confirmOrderReply(event.source);
    }

    return reply;
}

async function handleMessageEvent(event) {

    const { source, message, replyToken } = event;
    console.log('message event:');
    console.log(source, message);
    
    await getUserProfile(source.userId);
    console.log('users',users);

    const { currentOrder } = users[source.userId];
    if (currentOrder) {
        const replyData = await handleOrder(currentOrder.item, event);
        return { replyToken, replyData };
    } else return { replyToken, replyData: textMessage(message.text) };
};


let carts = [];

const getRichMenuReply = async ({ data, param, source }) => {
    const { index } = data;
    const cartList = await ds.getCarts();
    carts = cartList || [];

    const cartFilter
        = index == 0? a => a.userId === source.userId
        : index == 1? a => a.userId !== source.userId
        : a => a;

    const viewCarts = cartCarousel(source, carts.filter(cartFilter));
    return viewCarts;
};

const getShopMenuQuickReply = async ({ data, param, source }) => {
    const { cartId } = data;

    if (cartId) {
        // from a cart
        const cartData = await getCartDataById(cartId);
        return quickReply([
            getOrderDrinkPostback(cartData,source.userId === cartData.owner.userId)
        ]);
    } else {
        // from shop list
        return quickReply([
            messageAction('shop menu quick reply from list')
        ]);
    }
}

const getShopMenuReply = async (postback) => {
    const shop = await getShop(postback.data.shopId);
    const quickReply = await getShopMenuQuickReply(postback);

    return shop.menuUrls.map( (url,index) => {
        const baseAction = imageAction(url);
        return index === shop.menuUrls.length - 1? {
            ...baseAction, quickReply
        }: baseAction;
    });
};

const newDrink = () => ({
    name: '',
    sugar: '',
    ice: '',
    size: ''
});

const getOrderDrinkReply = ({ data, param, source }) => {
    const { cartId } = data;
    const cart = ds.getCartById(cartId);
    if (cart) {
        users[source.userId].currentOrder = {
            time: new Date(),
            item: newDrink()
        };
        return textMessage('請問要喝哪種飲料呢?');
    } else return textMessage('訂單已經過期');
}

function getPostbackReply(postback) {
    const { action } = postback.data;
    switch (action) {
        case 'RICH_MENU':
            return getRichMenuReply(postback);
        case 'SHOP_MENU':
            return getShopMenuReply(postback);
        case 'ORDER_DRINK':
            return getOrderDrinkReply(postback)
        default:
            return textMessage(action);
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

const getShopMenuPostback = (shop,cartId) => {
    const data = qs.stringify({
        action: 'SHOP_MENU',
        shopId: shop.shopId,
        cartId: cartId
    });

    return postbackAction('看菜單', data, {
        displayText: `看${shop.nameZH}(${shop.branch})菜單`
    });
};

const getOrderDrinkPostback = (cartData, mine) => {
    const { owner, cartId } = cartData;
    const label = mine
        ? '幫自己訂一杯'
        : `跟著${owner.displayName}訂一杯`;

    const data = qs.stringify({
        action: 'ORDER_DRINK', cartId
    });
    return postbackAction(label, data, {
        displayText: label,
    })
};

const getCartDataById = async (cartId) => {
    const cart = await ds.getCartById(cartId);
    return getCartData(cart);
};

const getCartData = async (cart) => {
    const cartId = ds.getKey(cart);
    const [owner, shop] = await Promise.all([
        getUserProfile(cart.userId),
        getShop(cart.shopId)
    ]);
    
    console.log('cart', cart, owner, shop);
    return {
        ...cart,
        cartId,
        owner,
        shop
    };
}

const cartCarouselCol = async (source,cart) => {
    const cartData = await getCartData(cart);

    const { owner, shop, cartId } = cartData;
    const mine = owner.userId === source.userId;

    const actions = [];
    
    // 看菜單
    if (shop.menuUrls.length) {
        actions.push(getShopMenuPostback(shop,cartId));
    }
    
    // 跟單
    actions.push(getOrderDrinkPostback(cartData,mine));

    // 結單
    if (mine) {
        actions.push(messageAction('結單'));
    }

    const exp = cart.expiration;
    const desc = `預計 ${exp.getMonth()+1}/${exp.getDate()} ${exp.getHours()}:${exp.getMinutes()} 結單`;

    return carouselCol(desc, actions, {
        title:`${shop.nameZH}(${owner.displayName})`,
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

const textMessage = (text) => ({
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

const quickReply = (actions) => ({
    items: actions.map( action => baseAction(action) )
});

const baseAction = (action) => ({
    type: 'action', action
});

const basePostbackAction = (label, data, config) => ({
    type: 'action',
    action: postbackAction(label, data, config)
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