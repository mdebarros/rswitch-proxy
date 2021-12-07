require('dotenv').config()
const Koa = require('koa');
const indexRoutes = require('./routes.js');
const bodyParser = require('koa-bodyparser');
const xmlBodyParser = require('./lib/xml').koaBodyParser;

const app = new Koa();
const PORT = process.env.PORT || 4444;

app.use(xmlBodyParser());
app.use(bodyParser());

app.use(xmlBodyParser({
  onerror: (err, ctx) => {
      ctx.response.type = 'text/html';
      ctx.response.status = 400;
      ctx.response.body = '';
  },
}));

app.use(indexRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;