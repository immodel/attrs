var assert = require('assert');
var model = require('immodel')
  .use(require('immodel-base'), {attrs: require('..')});

describe('attrs', function() {
  it('should work', function() {
    var User = model
      .attr('username', 'string');

    var doc = new User();
    doc.get('username');
    assert(doc.get('username').value === '');

    doc = doc.set('username', 'test');
    assert(doc.get('username').value === 'test');

    doc = doc.set('username', 1);
    assert(doc.get('username').value !== 1);
    assert(doc.get('username').value === '1');
  });

  it('should inherit', function() {
    var User = model
      .attr('username', 'string');

    var Teacher = User
      .attr('class', 'string');

    // Should inherit
    var doc = new Teacher();
    assert(doc.get('username').value === '');
    assert(doc.get('class').value === '');

    // Should not pollute the parent
    doc = new User();
    assert(doc.get('username').value === '');
    assert(doc.get('class').value === undefined);
  });

  it('should nest', function() {
    var User = model
      .attr('name', model
        .attr('familyName', 'string'));

    var doc = new User();
    doc = doc.set('name.familyName', 'test');

    assert(doc.get('name.familyName').value === 'test');
  });

  it('should iterate over all attributes', function() {
    var User = model
      .attr('id', 'number')
      .attr('*', 'string');

    var user = new User({});
    user = user.set('username', 'dobis');

    var attrs = [];
    user.eachAttr(function(name) {
      attrs.push(name);
    });

    assert(attrs.indexOf('username') !== -1);
    assert(attrs.indexOf('id') !== -1);
  });
});