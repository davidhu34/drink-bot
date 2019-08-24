const utils = require('./utils');
const ds = require('../datastore');
const { users, getCurrentOrder } = require('./users');
const pb = require('./postbacks')

let carts = [];

const getRichMenuReply = async ({ data, params, source }) => {
    const { index } = data;
    const cartList = await ds.getCarts();
    carts = cartList || [];

    const cartFilter
        = index == 0? a => a.userId === source.userId
        : index == 1? a => a.userId !== source.userId
        : a => a;

    const viewCarts = carts.filter(cartFilter);
    if (viewCarts.length) {
        return pb.cartCarousel(source, carts.filter(cartFilter));
    } else {
        return pb.shopCarousel();
    }
};

const getNewCartReply = async ({ data, params, source }) => {
    const shopId = data.shopId;
    const userId = source.userId;
    console.log('time',params.datetime);
    const cartEntity = await ds.saveCart({
        shopId,
        userId,
        expiration: new Date(params.datetime)
    });
    return pb.cartCarousel(source, [ds.entityToData(cartEntity)]);
};

const getShopMenuQuickReply = async ({ data, params, source }) => {
    const { cartId } = data;

    if (cartId) {
        // from a cart
        const cartData = await utils.getCartDataById(cartId);
        const orderAction = await pb.getOrderOrRevokeAction(cartData,source.userId);
        return utils.quickReply([
            orderAction
        ]);
    } else {
        // from shop list
        return utils.quickReply([
            utils.messageAction('shop menu quick reply from list')
        ]);
    }
}

const getShopMenuReply = async (postback) => {
    const shop = await ds.getShopById(postback.data.shopId);
    const quickReply = await getShopMenuQuickReply(postback);

    return shop.menuUrls.map( (url,index) => {
        const baseAction = utils.imageAction(url);
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

const getOrderDrinkReply = ({ data, params, source }) => {
    const { cartId } = data;
    const cart = ds.getCartById(cartId);
    if (cart) {
        users[source.userId].currentOrder = {
            cartId,
            time: new Date(),
            item: newDrink()
        };
        return utils.textMessage('請問要喝哪種飲料呢?');
    } else return utils.textMessage('訂單已經過期');
}

const getSubmitOrderReply = async ({ data, params, source }) => {
    const affirmative = data.flag == 1;
    const userId = source.userId;
    if (affirmative) {
        const currentOrder = getCurrentOrder(userId);
        const { cartId, time, item } = currentOrder;
        const orderEntity = await ds.saveOrder({
            cartId,
            userId,
            time,
            ...item,
        });
        console.log(orderEntity);
    }
    users[userId].currentOrder = null;
    return affirmative? utils.textMessage('訂好了'): utils.textMessage('取消了');
};

const getConfirmRevokeReply = ({ data, params, source }) => {
    return getConfirmationMessage(
        `確定取消飲料?`,
        'SUBMIT_REVOKE_ORDER',
        { orderId: data.orderId }
    );
};

const getSubmitRevokeReply = async ({ data, params, source }) => {
    const orderId = data.orderId;
    await ds.deleteOrder(orderId);
    return utils.textMessage('取消飲料了');
}

exports.getPostbackReply = function (postback) {
    const { action } = postback.data;
    switch (action) {
        case 'RICH_MENU':
            return getRichMenuReply(postback);
        case 'NEW_CART':
            return getNewCartReply(postback);
        case 'SHOP_MENU':
            return getShopMenuReply(postback);
        case 'ORDER_DRINK':
            return getOrderDrinkReply(postback);
        case 'SUBMIT_ORDER_DRINK':
            return getSubmitOrderReply(postback);
        case 'CONFIRM_REVOKE_ORDER':
            return getConfirmRevokeReply(postback);
        case 'SUBMIT_REVOKE_ORDER':
            return getSubmitRevokeReply(postback);
        default:
            return utils.textMessage(action);
    }
};