var series = require('series');
var clone = require('clone');
var isEmpty = require('isempty');
var immodel = require('immodel');

module.exports = function() {
  this.attrs = this.attrs || {};

  this.attr = function(name, type) {
    if(arguments.length === 1) {
      // Support wildcard attributes
      if(! this.hasAttr(name) && this.hasAttr('*'))
        name = '*';

      name = '$' + name;
      if(! this.is(this.attrs[name])) {
        this.attrs[name] = coerce(this, this.attrs[name]);
      }
      return this.attrs[name];
    }

    if('string' === typeof type)
      type = {type: type};

    return this.use(function() {
      if(isEmpty(this.attrs)) {
        this.on('init', function(evt) {
          // Things that have attributes should have
          // a default value of empty object if
          // otherwise undefined
          var doc = evt.doc;
          if(doc.value === undefined)
            doc.value = {};
        });
      }

      this.attrs['$' + name] = type;
    });
  };

  this.hasAttr = function(name) {
    return !! this.attrs['$' + name];
  };

  this.prototype.set = function(path, leafValue) {
    var idx = path.indexOf('.');
    if(idx !== -1) {
      var first = path.slice(0, idx);
      var rest = path.slice(idx + 1);
      return this.set(path.slice(0, idx), this.get(first).set(rest, leafValue));
    }

    var value = clone(this.value, true, 1);
    value[path] = leafValue;
    return (new this.model(value));
  };

  this.prototype.get = function(path) {
    var idx = path.indexOf('.');
    if(idx !== -1)
      return this.get(path.slice(0, idx)).get(path.slice(idx + 1));

    var type = this.model.attr(path);

    // We should probably either throw an exception here or at least
    // add a configuration option to do so.  For now, we return
    // an instance of the base immodel type with undefined value
    if(! type) return (new immodel());

    if(! type.isDocument(this.value[path])) {
      this.value[path] = new type(this.value[path]);
    }

    return this.value[path];
  };

  this.isDocument = function(value) {
    return value && value.__isDocument;
  };

  this.prototype.toJSON = function() {
    var value = this.value;
    var model = this.model;
    var json = {};

    if(isEmpty(this.attrs))
      return value;

    Object.keys(value).forEach(function(key) {
      var val = value[key];
      json[key] = model.isDocument(val)
        ? val.toJSON()
        : val;
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