/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Steven Oderayi - steven.oderayi@modusbox.com                     *
 **************************************************************************/

const Next = require('koa').Next;
const getRawBody = require('raw-body');
const FastXmlParser = require('fast-xml-parser');

const xmlOptions = {
    attributeNamePrefix: '',
    attrNodeName: 'attr',
    textNodeName: '#text',
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: false,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: '__cdata',
    cdataPositionChar: '\\c',
    parseTrueNumberOnly: false,
    arrayMode: false,
};

const json2Xml = (xmlObj, options = xmlOptions) => {
    const parser = new FastXmlParser.XMLBuilder(options);
    return parser.build(xmlObj);
};

const xml2Json = (xmlstr, options = xmlOptions) => {
    const parser = new FastXmlParser.XMLParser(options);
    return parser.parse(xmlstr, xmlOptions);
};

const parse = (request, options) => {
    const opt = {
        limit: '1mb', encoding: 'utf8', xmlOptions: {}, ...options,
    };
    const len = request.headers['content-length'];
    if(len) opt.length = len;
    return getRawBody(request, opt).then((str) => {
        const jsonData = xml2Json(str, opt.xmlOptions);
        const rawBody = str;
        return {
            jsonData,
            rawBody,
        };
    }).catch((e) => {
        const err = typeof e === 'string' ? new Error(e) : e;
        err.status = 400;
        err.body = e.message;
        throw err;
    });
};

const koaBodyParser = (options = xmlOptions) => (ctx, next) => {
    /**
     * only parse and set ctx.request[option.key] when
     * 1. type is xml (text/xml and application/xml)
     * 2. method is post/put/patch
     * 3. ctx.request[option.key] is undefined
     */
    const opt = { key: 'body', ...options };

    if((ctx.request)[opt.key] === undefined
        && ctx.is('text/xml', 'xml')
        && /^(POST|PUT|PATCH)$/i.test(ctx.method)
    ) {
        if(!opt.encoding && ctx.request.charset) {
            opt.encoding = ctx.request.charset;
        }
        return parse(ctx.req, opt).then(result => {
            (ctx.request)[opt.key] = result.jsonData;
            ctx.request.rawBody = result.rawBody;
            return next();
        }).catch(err => {
            if(opt.onerror) {
                opt.onerror(err, ctx);
            } else {
                throw err;
            }
        });
    }
    return next();
};

module.exports = {
    koaBodyParser,
    json2Xml,
    xml2Json,
    xmlOptions
}