// const http = require('http');
// const https = require('https');
// const fs = require('fs');
const Koa = require('koa');
const app = new Koa();

// const bodyParser = require('koa-bodyparser');

// const { applyMiddlewares } = require('./middleware');
// applyMiddlewares(app);

const router = require('./router')(app);

const lineBot = require('./linebot')(app);

const { PORT } = require('./configs');
app.listen(PORT);
// https.createServer(app.callback()).listen(PORT);