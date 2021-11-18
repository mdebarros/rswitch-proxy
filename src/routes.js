const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = {
    message: 'Rswitch Proxy'
  };
})

router.post('/transfers', async (ctx) => {
  // console.log(ctx.req);
  console.log(`received: ctx.request.body `);
  ctx.req.on('data', aa =>{
    console.log('Data: ' + aa);
  })
  const message = `<?xml version="1.0" encoding="utf-8"?>
  <Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.12">
      <FIToFIPmtStsRpt>
          <GrpHdr>
              <MsgId>7e2599df80a14f6eb38199536c4d2691</MsgId>
              <CreDtTm>2021-07-27T22:31:53.283Z</CreDtTm>
          </GrpHdr>
          <TxInfAndSts>
              <OrgnlInstrId>8c5d9f95</OrgnlInstrId>
              <OrgnlEndToEndId>0120a604aa8043dab6f6c1d5f8aa622e</OrgnlEndToEndId>
              <OrgnlTxId>acd1ef76</OrgnlTxId>
              <TxSts>RJCT</TxSts>
          </TxInfAndSts>
      </FIToFIPmtStsRpt>
  </Document>`;
  ctx.response.set('Content-Type', 'application/xml');
  ctx.response.type = 'application/xml';
  ctx.response.body = message;
  ctx.response.status = 200;
  // ctx.header['content-type'] = 'application/xml';

})

module.exports = router;