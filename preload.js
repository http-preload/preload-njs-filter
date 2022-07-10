import fs from 'fs';
// import path from './src/path.js';
import shared from './lib/preload-shared.js';
const PreloadManifest = shared.PreloadManifest;
const getUserAgentData = shared.getUserAgentData;
const getUserAgentDataByClientHints = shared.getUserAgentDataByClientHints;

function getRequestHeaders(r) {
  let brief = false;
  let msg = '';
  let method = r.method;
  let path = r.variables.request_uri;
  let scheme = r.variables.scheme;
  if (parseFloat(r.httpVersion) < 2) {
    let authority = r.headers.host;
    if (brief) {
      msg = method + ' ' + scheme + '://' + authority + path + ' ' + r.variables.server_protocol;
    } else {
      msg = method + ' ' + path + ' ' + r.variables.server_protocol + '\n';
      let rawHeaders = r.rawHeadersIn;
      for (let i = 0, e; i < rawHeaders.length; i += 1) {
        e = rawHeaders[i];
        msg += e[0] + ': ' + e[1] + '\n';
      }
    }
  } else {
    let authority = r.headers.host || r.variables.server_name + ':' + r.variables.server_protocol;
    if (brief) {
      msg = method + ' ' + scheme + '://' + authority + path + ' ' + r.variables.server_protocol;
    } else {
      msg += ':method: ' + method + '\n';
      msg += ':path: ' + path + '\n';
      msg += ':scheme: ' + scheme + '\n';
      msg += ':authority: ' + authority + '\n';
      let rawHeaders = r.rawHeadersIn;
      for (let i = 0, e; i < rawHeaders.length; i += 1) {
        e = rawHeaders[i];
        msg += e[0] + ': ' + e[1] + '\n';
      }
    }
  }
  return msg;
}

/**
 * @class ConditionArgsSupplier
 * @constructor
 * @param {HTTPRequest} r
 */
function ConditionArgsSupplier(r) {
  let value;
  /**
   * @method get
   * @returns {Object}
   */
  this.get = () => {
    if (value === undefined) {
      let headers = r.headersIn;
      let userAgentData;
      let uaBrands = headers['sec-ch-ua'];
      let userAgent;
      if (uaBrands !== undefined) {
        userAgentData = getUserAgentDataByClientHints(uaBrands, headers['sec-ch-ua-mobile'], headers['sec-ch-ua-platform']);
      } else {
        userAgent = headers['user-agent'];
        userAgentData = getUserAgentData(userAgent);
      }
      // let psuedoHeaders;
      // let variables = r.variables;
      // if (r.httpVersion < 2) {
      //   psuedoHeaders = {
      //     ':method': r.method,
      //     ':path': variables.request_uri,
      //     ':scheme': variables.scheme,
      //     ':authority': headers['host'],
      //     ':protocol': 'http/' + r.httpVersion
      //   };
      // } else {
      //   psuedoHeaders = {
      //     ':method': r.method,
      //     ':path': variables.request_uri,
      //     ':scheme': variables.scheme,
      //     ':authority': headers['host'] || variables.server_name + ':' + variables.server_protocol,
      //     ':protocol': r.httpVersion === '2.0' ? 'h2' : 'h3'
      //   };
      // }
      value = [userAgentData, headers];
    }
    return value;
  };
}

let initialized = false;
let settings;
let manifest;
function init(options) {
  settings = Object.assign({
    manifestFile: null,
    index: 'index.html',
  }, options);
  let manifestFile = settings.manifestFile;
  if (!manifestFile) {
    throw new Error('options manifestFile must be specified');
  }
  manifest = new PreloadManifest(JSON.parse(fs.readFileSync(manifestFile, {encoding: 'utf8'})));
}
// init(preloadOptions);

function getLinkHeaderValue(r) {
  if ((r.headersIn['accept'] || '').startsWith('text/html') && r.method === 'GET') {
    let reqPath = r.uri;
    if (reqPath.endsWith('/')) {
      reqPath += settings.index;
    }
    let candicates =  manifest.lookup(reqPath);
    if (candicates && candicates.length > 0) {
      let argsSupplier = new ConditionArgsSupplier(r);
      let headerValue = [];
      candicates.forEach((candidate) => {
        if (!candidate.condition || candidate.condition.apply(undefined, argsSupplier.get())) {
          headerValue.push(candidate.headerValue);
        }
      });
      if (headerValue.length > 0)
        return headerValue.join(', ');
    }
  }
  return '';
}
function setHeaders(r) {
  if (!initialized) { // not initialized
    initialized = true;
    let options;
    try {
      options = JSON.parse(r.variables.preload_options);
    } catch (e) {
      r.error(e);
      return;
    }
    try {
      init(options);
    } catch (e) {
      r.error(e);
      return;
    }
  } else if (!manifest) { // initialization failed
    return;
  }
  let headerValue = getLinkHeaderValue(r);
  if (headerValue.length > 0) {
    r.headersOut['Link'] = headerValue;
  }
}

export default {setHeaders, getRequestHeaders};
