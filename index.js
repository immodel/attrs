var series = require('series');

module.exports = function() {
  this.attrs = this.attrs || {};

  this.attr = function(name, type) {
    if(arguments.length === 1) {
      // Support wildcard attributes
      if(! this.attrs[name] && this.hasAttr('*'))
        name = '*';

      name = '$' + name;
      if(! this.is(this.attrs[name]))
        this.attrs[name] = coerce(this, this.attrs[name]);
      return this.attrs[name];
    }

    if('string' === typeof type)
      type = {type: type};

    return this.use(function() {
      this.complex = true;
      this.attrs['$' + name] = type;
    });
  };

  this.hasAttr = function(name) {
    return !! this.attrs['$' + name];
  };

  this.prototype.set = function(path, value) {
    var idx = path.lastIndexOf('.');
    if(idx !== -1) {
      this.get(path.slice(0, idx)).set(path.slice(idx + 1), value);
      return this;
    }

    this.value[path] = type.runSetters(value, this);
    return this;
  };

  this.prototype.get = function(path) {
    var idx = path.indexOf('.');
    if(idx !== -1)
      return this.get(path.slice(0, idx)).get(path.slice(idx + 1));

    var type = this.model.attr(path);
    var value = this.value[path];

    // We should probably either throw an exception here or at least
    // add a configuration option to do so
    if(! type) return;

    if(type.complex && ! is(value)) {
      value = this.value[path] = new type(value);
    }

    return type.runGetters(value, this);
  };

  function is(value) {
    return value && value.__isDocument;
  }

  this.prototype.toJSON = function() {
    var value = this.value;
    var json = {};

    Object.keys(value).forEach(function(key) {
      var val = value[key];
      json[key] = is(val) ? val.toJSON() : val;
    });

    return json;
  };

  this.prototype.eachAttr = function(fn) {
    var model = this.model;

    Object.keys(model.attrs).forEach(function(name) {
      name = name.slice(1);
      if(name === '*') return;

      fn(name, model.attr(name));
    });

    if(model.hasAttr('*')) {
      Object.keys(this.value || {}).forEach(function(name) {
        if(! model.hasAttr(name))
          fn(name, model.attr(name));
      });
    }
  };

  this.prototype.eachAttrAsync = function(fn, cb) {
    var attrs = [];
    this.eachAttr(function(name, type) {
      attrs.push([name, type]);
    });

    series(attrs, function(tuple, next) {
      fn(tuple[0], tuple[1], next);
    }, cb);
  };
};


function coerce(model, opts) {
  if(! opts) return;

  type = model.is(opts.type)
    ? opts.type
    : model.lookup(opts.type);

  if(! type) throw new Error('type "' + opts.type + '" has not been registered');
  delete opts.type;
  return type.use(opts);
}