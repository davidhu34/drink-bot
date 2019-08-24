const { getUserProfile } = require('./users');
const ds = require('../datastore');

const getCartData = async (cart) => {
    const cartId = ds.getKey(cart);
    const [owner, shop] = await Promise.all([
        getUserProfile(cart.userId),
        ds.getShopById(cart.shopId)
    ]);
    
    console.log('cart', cart, owner, shop);
    return {
        ...cart,
        cartId,
        owner,
        shop
    };
};

exports.getCartData = getCartData;

exports.getCartDataById = async (cartId) => {
    const cart = await ds.getCartById(cartId);
    return getCartData(cart);
};


exports.textMessage = (text) => ({
    type: 'text', text
});

exports.confirmMessage = (text, actions) => ({
    type: 'template',
    altText: text,
    template: {
        type: 'confirm', text, actions
    }
});

exports.carouselCol = (text,actions,config) => ({
    text, actions, ...config
});

exports.carousel = (columns, altText) => ({
    type: 'template',
    altText,
    template: {
        type: 'carousel',
        columns
    }
});

exports.imageCarouselCol = (imageUrl,action) => ({
    imageUrl, action
});

exports.imageCarousel = (columns,altText) => ({
    type: 'template',
    altText,
    template: {
        type: 'image_carousel',
        columns
    }
});


exports.datetimePickerAction = (label, data, config = {}) => ({
    type: 'datetimepicker',
    mode: 'datetime',
    label,
    data,
    ...config
});

const baseAction = (action) => ({
    type: 'action', action
});

exports.baseAction = baseAction;

exports.quickReply = (actions) => ({
    items: actions.map( action => baseAction(action) )
});

const postbackAction = (label, data, config = {}) => ({
    type: 'postback',
    label,
    data,
    ...config
});

exports.postbackAction = postbackAction;

exports.basePostbackAction = (label, data, config) => ({
    type: 'action',
    action: postbackAction(label, data, config)
});

exports.uriAction = (label,uri) => ({
    type: 'uri',
    label,
    uri,
});

exports.messageAction = (label,text = '') => ({
    type: 'message',
    label,
    text: text || label,
});

exports.imageAction = (url) => ({
    type: 'image',
    originalContentUrl: url,
    previewImageUrl: url
});