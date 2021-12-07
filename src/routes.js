const Router = require('koa-router');
const Env = require('env-var');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');


const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = {
    message: 'Rswitch Proxy'
  };
})

const toPACS002Response = (xmlReqObj, status = 'PDNG') => {
  return `<?xml version="1.0" encoding="utf-8"?>
  <Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10">
      <FIToFIPmtStsRpt>
          <GrpHdr>
              <MsgId>${xmlReqObj.Document.FIToFICstmrCdtTrf.GrpHdr.MsgId}</MsgId>
              <CreDtTm>2021-07-27T22:31:53.283Z</CreDtTm>
          </GrpHdr>
          <TxInfAndSts>
              <OrgnlInstrId>${xmlReqObj.Document.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.InstrId}</OrgnlInstrId>
              <OrgnlEndToEndId>${xmlReqObj.Document.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.EndToEndId}</OrgnlEndToEndId>
              <OrgnlTxId>${xmlReqObj.Document.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.TxId}</OrgnlTxId>
              <TxSts>${status}</TxSts>
          </TxInfAndSts>
      </FIToFIPmtStsRpt>
  </Document>`;
}

const processAsyncRequest = async (id, body, options) => {
  const { baseURL, routeURL, timeout, status } = options

  const request = axios.create({
    // baseURL,
    timeout
  });
  const asyncCallbackRequest = toPACS002Response(body, status);

  const headers = {
    'Content-Type': 'application/xml',
    Accept: 'application/xml',
    Date: new Date().toUTCString(),
  };

  console.log({
    callbackRequest: {
      id,
      baseURL,
      routeURL,
      timeout,
      body: asyncCallbackRequest,
      headers
    }
  })

  let asyncResponse = {}
  try {
    asyncResponse = await request.post(routeURL, asyncCallbackRequest, { headers });

    console.log({
      callbackResponse: {
        id,
        baseURL,
        routeURL,
        timeout,
        status: asyncResponse.status,
        body: asyncResponse.body,
        headers: asyncResponse.headers
      }
    })
  } catch (error) {
    console.log({
      callbackResponse: {
        id,
        baseURL,
        routeURL,
        timeout,
        error,
        status: asyncResponse.status,
        body: asyncResponse.body,
        headers: asyncResponse.headers
      }
    })
  }
}

router.post('/transfers', async (ctx) => {
  const id = uuidv4();
  console.log(`received: ctx.request.body `);
  ctx.req.on('data', aa =>{
    console.log('Data: ' + aa);
  })

  try {
    let sstatus = Env.get('ENV_SSTATUS').default('PDNG').asString();
    let sreturncode = Env.get('ENV_SRETCODE').default('200').asInt();
    let cbstatus = Env.get('ENV_CBSTATUS').default('ACSC').asString();
    let isCallbackDisabled = Env.get('ENV_IS_CALLBACK_DISABLED').default('false').asBool();

    // const cbBaseURL = Env.get('CB_BASEURL').default('http://localhost:3003/outbound/iso20022').asString();
    const cbBaseURL = Env.get('CB_BASEURL').default('').asString();
    const cbRouteURL = Env.get('CB_ROUTE').default('http://localhost:3003/outbound/iso20022').asString();
    // const cbRouteURL = Env.get('CB_ROUTE').default('').asString();
    const cbTimeout = Env.get('CB_TIMEOUT').default(5000).asInt();

    if (ctx.request.query && ctx.request.query.sstatus) {
      sstatus = ctx.request.query.sstatus;
    };

    if (ctx.request.query && ctx.request.query.callback && ctx.request.query.callback && ctx.request.query.callback.toLowerCase() === 'false') {
      isCallbackDisabled = true;
    };
    
    const syncResponse = toPACS002Response(ctx.request.body, sstatus)

    if (!isCallbackDisabled) {
      if (ctx.request.query && ctx.request.query.cbstatus) {
        cbstatus = ctx.request.query.astatus;
      };
    
      const callbackOps = {
        status: cbstatus,
        baseURL: cbBaseURL,
        routeURL: cbRouteURL,
        timeout: cbTimeout
      }

      processAsyncRequest(id, ctx.request.body, callbackOps);
    }

    console.log({
      request: {
        id,
        sstatus,
        cbstatus,
        callback: isCallbackDisabled,
        headers: ctx.request.headers,
        body: ctx.request.rawBody
      }
    })

    ctx.response.set('Content-Type', 'application/xml');
    ctx.response.type = 'application/xml';
    ctx.response.body = syncResponse;
    ctx.response.status = sreturncode;

    console.log({
      response: {
        id,
        type: ctx.response.type,
        body: ctx.response.body,
        status: ctx.response.status
      }
    })
  } catch (error) {
    console.log(error);
  }
})

module.exports = router;
