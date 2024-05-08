
function dirname(s) {
  let pos = s.lastIndexOf('/');
  if (pos === -1)
    return '.';
  return s.slice(0, pos);
}
function basename(s, ext) {
  let pos = s.lastIndexOf('/');
  let name;
  if (pos === -1) {
    name = s;
  } else {
    name = s.slice(pos + 1);
  }
  if (typeof ext === 'string' && ext.length > 0 && name.endsWith(ext))
    return name.slice(0, -ext.length);
  return name;
}
function extname(s) {
  let name = basename(s);
  let pos = name.lastIndexOf('.');
  return pos > 0 ? name.slice(pos) : '';
}
function parse(s) {
  let base = basename(s);
  let ext = extname(s);
  return {
    root: '',
    dir: dirname(s),
    base,
    ext,
    name: basename(base, ext),
  };
}
function join(...segs) {
  let s = '';
  if (segs.length === 0 || segs[0] === '') {
    return s;
  }
  s = segs[0];
  let endsWithSlash = s.endsWith('/');
  for (let i = 1; i < segs.length; i++) {
    let seg = segs[i];
    if (!seg)
      continue;
    if (endsWithSlash) {
      if (seg.startsWith('/'))
        s += seg.slice(1);
      else
        s += seg;
    } else if (seg.startsWith('/')) {
      s += seg;
    } else {
      s += '/' + seg;
    }
  }
  return s;
}
function format(obj) {
  return join(obj.dir, obj.base);
}
/**
 * @param {string} from  "a/b/c"
 * @param {string} to
 * @returns {string}
 */
function relative(from, to, alwaysAddPrefix) {
  if (from.startsWith('/') !== to.startsWith('/')) {
    throw new Error('Mixed absolute path and relative path');
  }
  let basePath;
  let pos = from.lastIndexOf('/');
  if (pos === -1) {
    return to;
  }
  if (pos + 1 !== from.length) {
    basePath = from.slice(0, pos + 1);
  } else {
    basePath = from;
  }
  if (basePath === to)
    return './';
  let relPath = '';
  let current = basePath;
  while (!to.startsWith(current)) {
    const index = current.lastIndexOf('/', current.length - 2);
    if (index !== -1)
      relPath += '../';
    current = current.slice(0, index + 1);
    continue;
  }
  if (relPath === '' && alwaysAddPrefix) {
    relPath = './';
  }
  relPath += to.slice(current.length);
  return relPath;
}
function normalize(str) {
  let a = str.split(/\/\/*/);
  let segs = [];
  let firstSeg = a[0];
  segs.push(firstSeg);
  let absolute = firstSeg.startsWidth('/') || firstSeg.search(/^[a-zA_Z]:/) === 0;
  for (let i = 1, iMax = a.length - 1; i < a.length; i += 1) {
    let seg = a[i];
    if (seg === '.') {
      // NOOP
    } else if (seg === '') {
      if (i === iMax) {
        segs.push(seg);
      }
    } else if (seg === '..') {
      if (segs.length === 1) {
        if (absolute) {
          // NOOP
        } else if (firstSeg === '.') {
          segs[0] = firstSeg = seg;
        } else {
          segs.push(seg);
        }
      } else {
        let prevSeg = segs[segs.length - 1];
        if (prevSeg === '..') {
          segs.push(seg);
        } else {
          segs.pop();
        }
      }
    } else {
      segs.push(seg);
    }
  }
  return segs.join('/');
}
const sep = '/';
export default {
  sep,
  dirname,
  basename,
  extname,
  parse,
  normalize,
  join,
  format,
  relative,
};
