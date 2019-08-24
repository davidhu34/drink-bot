const qs = require('querystring');
const moment = require('moment');

const utils = require('./utils');
const { users, getUserProfile, getCurrentOrder } = require('./users');
const { getPostbackReply } = require('./postbackReply');
const pb = require('./postbacks');

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

const sizeDescList = ['大','中','小'];
const iceDescList = ['正常', '少冰', '半冰', '微冰', '去冰'];
const sugarDescList = ['正常', '少糖', '半糖', '微糖', '無糖'];

const orderInfoReply = (msg, descList) => ({
    ...utils.textMessage(msg),
    quickReply: utils.quickReply(
        descList.map(desc => utils.messageAction(desc))
    )
});

const confirmOrderReply = ({ userId }) => {
    const { item } = getCurrentOrder(userId);
    const { name, size, ice, sugar } = item;
    return pb.getConfirmationMessage(
        `確認: ${name} ${size} ${ice} ${sugar}`,
        'SUBMIT_ORDER_DRINK'
    );
};

const fillOrder = (filling, { source, message }) => {
    const currentOrder = getCurrentOrder(source.userId);
    const { item } = currentOrder;
    const order = {
        ...currentOrder,
        item: {
            ...item,
            [filling]: message.text
        }
    };
    users[source.userId].currentOrder = order;
    return order;
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
    const userId = source.userId;
    console.log('message event:');
    console.log(source, message);
    
    await getUserProfile(userId);
    console.log('users',users);

    const currentOrder = getCurrentOrder(userId)
    if (currentOrder) {
        const replyData = await handleOrder(currentOrder.item, event);
        return { replyToken, replyData };
    } else return { replyToken, replyData: utils.textMessage(message.text) };
}

async function handlePostbackEvent(event) {

    const { source, postback, replyToken } = event;
    
    const data = qs.parse(postback.data);
    const params = postback.params;
    console.log('postback event:');
    console.log(source,postback);
    
    await getUserProfile(source.userId);
    console.log('users',users);

    const replyData = await getPostbackReply({ data, params, source });
    return { replyToken, replyData };
}