import fs from 'fs';
import path from './path.js';

let initialized = false;
let manifest;
function init(manifestFile) {
  if (!manifestFile) {
    throw new Error('options.manifestFile is required');
  }
  let obj = JSON.parse(fs.readFileSync(manifestFile, {encoding: 'utf8'}));
  if (obj.manifestVersion !== 1) {
    throw new Error('Cannot handle manifestVersion ' + manifestVersion);
  }
  if (!obj.resources || typeof obj.resources !== 'object') {
    throw new Error('Cannot handle resources');
  }
  manifest = obj;
}

function setHeaders(r) {
  if (!initialized) { // not initialized
    initialized = true;
    let options;
    try {
      options = JSON.parse(r.variables.preload_menifest);
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
  if ((r.headersIn['Accept'] || '').startsWith('text/html') && r.method === 'GET') {
    let reqPath = r.uri;
    if (reqPath.endsWith('/')) {
      reqPath += path.basename(r.variables.request_filename);
    }
    let headers =  manifest.resources[reqPath];
    if (headers) {
      let names = Object.keys(headers);
      for(let i=0, name; i<names.length; ++i) {
        name = names[i];
        r.headersOut[name] = headers[name];
      }
    }
  }
}

export default {setHeaders, getRequestHeaders};
