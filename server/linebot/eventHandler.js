module.exports = client => async function (event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
       return Promise.resolve(null);
    }
    console.log(event);
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text
    }).catch( error => {
        const { statusCode, statusMessage } = error;
        console.log(statusCode, statusMessage);
    });
}