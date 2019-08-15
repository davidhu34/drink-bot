// const bodyParser = require('koa-bodyparser');

const logResponseTime = async function (ctx, next) {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.set('X-Response-Time', `${ms}ms`);
	const rt = ctx.response.get('X-Response-Time');
	console.log(`${ctx.method} ${ctx.url} - ${rt}`);
};

module.exports = {
    applyMiddlewares: function (app) {
        // app.use(logResponseTime);
        // app.use(bodyParser());
    }
}