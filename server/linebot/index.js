const line = require('@line/bot-sdk');

const { LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET } = require('../configs');
const config = {
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: LINE_CHANNEL_SECRET
};

const lineMiddleware = async function (ctx, next) {
    console.log(ctx.req.body);
    await line.middleware(config)(ctx.req, ctx.res, next);
}

const client = new line.Client(config);
const eventHandler = require('./eventHandler')(client);
const handleLineWebhook = async function (ctx, next) {
    const { events } = ctx.req.body;
    ctx.body = await Promise.all(events.map(eventHandler));
    await next();
}

const KoaRouter = require('koa-router');
const lineRouter = new KoaRouter();

lineRouter.use(lineMiddleware)
    .post('webhook', '/webhook', handleLineWebhook)

module.exports = app => {

    app.use(lineRouter.routes());

    return { client }
}