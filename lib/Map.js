function SimpleMap() {
  this.data = Object.create(null);
}
SimpleMap.prototype.get = function(k) {
  return this.data[k];
};
SimpleMap.prototype.set = function(k, v) {
  this.data[k] = v;
  return this;
};
SimpleMap.prototype.has = function(k) {
  return k in this.data;
};
SimpleMap.prototype.delete = function(k) {
  return delete this.data[k];
};
SimpleMap.prototype.clear = function(k) {
  let data = this.data;
  for (let k in data) {
    delete data[k];
  }
};
SimpleMap.prototype.forEach = function(fn, context) {
  let data = this.data;
  for (let k in data) {
    let v = data[k];
    fn.call(context, v, k);
  }
};
Object.defineProperty(SimpleMap.prototype, 'size', {
  enumerable: false,
  configurable: true,
  get: function() {
    let len = 0;
    let data = this.data;
    for (let _ in data) {
      len += 1;
    }
    return len;
  },
});
export default SimpleMap;
