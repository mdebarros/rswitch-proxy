const Koa = require('koa');
const indexRoutes = require('./routes.js');
const bodyParser = require('koa-body-parser');

const app = new Koa();
const PORT = process.env.PORT || 4444;
app.use(bodyParser());
app.use(indexRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;