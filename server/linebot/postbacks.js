const qs = require('querystring');

const utils = require('./utils');
const ds = require('../datastore');

const getShopMenuPostback = (shop,cartId) => {
    const data = qs.stringify({
        action: 'SHOP_MENU',
        shopId: shop.shopId,
        cartId: cartId
    });

    return utils.postbackAction('看菜單', data, {
        displayText: `看${shop.nameZH}(${shop.branch})菜單`
    });
};

const getRevokeOrderPostback = (cartData,order) => {
    const orderId = ds.getKey(order);
    const { owner, shop } = cartData;
    const mine = order.userId === cartData.userId;
    const label = mine
        ? `取消自己的${order.name}`
        : `取消跟${owner.displayName}訂的${order.name}`;

    const data = qs.stringify({
        action: 'CONFIRM_REVOKE_ORDER', orderId
    });
    return utils.postbackAction(label, data, {
        displayText: label,
    })
};

const getOrderDrinkPostback = (cartData, mine) => {
    const { owner, cartId } = cartData;
    const label = mine
        ? '幫自己訂一杯'
        : `跟著${owner.displayName}訂一杯`;

    const data = qs.stringify({
        action: 'ORDER_DRINK', cartId
    });
    return utils.postbackAction(label, data, {
        displayText: label,
    })
};

exports.getConfirmationMessage = (msg, action, postbackData = {}) => utils.confirmMessage(
    msg,
    [true, false].map(affirmative => {
        const label = affirmative? '確定': '取消';
        const data = qs.stringify({
            action,
            ...postbackData,
            flag: affirmative? 1: 2
        });
        return utils.postbackAction(label, data, {
            displayText: label,
        });
    })
);
const getOrderOrRevokeAction = async (cartData, userId) => {
    const userOrdersInCart = await ds.getUserOrderInCart(userId, cartData.cartId);
    
    if (userOrdersInCart.length) {
        const userOrder = userOrdersInCart[0];
        return getRevokeOrderPostback(cartData,userOrder);
    } else {
        const mine = cartData.userId === userId;
        return getOrderDrinkPostback(cartData,mine);
    }
};
exports.getOrderOrRevokeAction = getOrderOrRevokeAction;

const cartCarouselCol = async (source,cart) => {
    const cartData = await utils.getCartData(cart);

    const { owner, shop, cartId } = cartData;
    const mine = owner.userId === source.userId;

    const actions = [];
    
    // 看菜單
    if (shop.menuUrls.length) {
        actions.push(getShopMenuPostback(shop,cartId));
    }
    
    // 跟單 || 抽單
    const orderAction = await getOrderOrRevokeAction(cartData, source.userId);
    actions.push(orderAction)

    // 結單
    if (mine) {
        actions.push(utils.messageAction('統計'));
    }

    const exp = cart.expiration;
    const desc = `預計 ${exp.getMonth()+1}/${exp.getDate()} ${exp.getHours()}:${exp.getMinutes()} 結單`;

    return utils.carouselCol(desc, actions, {
        title:`${shop.nameZH}(${owner.displayName})`,
        thumbnailImageUrl: shop.logoUrl
    });
}

exports.cartCarousel = async (source,carts) => {
    console.log(carts);
    const columns = await Promise.all(
        carts.map(cart => cartCarouselCol(source,cart))
    );
    return utils.carousel(columns, '目前訂單');
}

const getShopPostback = (shop) => {
    const shopId = shop.shopId;
    const label = `訂${shop.nameZH}`;
    const data = qs.stringify({
        action: 'NEW_CART',
        shopId
    });
    return utils.datetimePickerAction(label, data, {});
}

exports.shopCarousel = async () => {
    const shops = await ds.getShops();
    console.log(shops);
    return utils.imageCarousel(
        shops.map( shop => utils.imageCarouselCol(shop.logoUrl, getShopPostback(shop)) ),
        '訂哪家',
    );
};
