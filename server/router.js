const KoaRouter = require('koa-router');

const router = new KoaRouter();

router.get('/', (ctx, next) => {
    ctx.body = 'hello world~~';
})

router.post('/', (ctx, next) => {
    ctx.body = 'hello world~~';
})

module.exports = app => {

    app.use(router.routes())
	    .use(router.allowedMethods());

    return router;
}