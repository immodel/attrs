var expect = require('chai').expect;
var model = require('immodel').bootstrap({attrs: require('../')});

describe('attrs', function() {
  it('should work', function() {
    var User = model
      .attr('username', 'string');

    var doc = new User();
    doc.get('username');
    expect(doc.get('username')).to.equal('');
    
    doc.set('username', 'test');
    expect(doc.get('username')).to.equal('test');
    
    doc.set('username', 1);
    expect(doc.get('username')).to.not.equal(1);
    expect(doc.get('username')).to.equal('1');
  });
  
  it('should inherit', function() {
    var User = model
      .attr('username', 'string');
       
    var Teacher = User
      .attr('class', 'string');
    
    // Should inherit
    var doc = new Teacher();
    expect(doc.get('username')).to.equal('');
    expect(doc.get('class')).to.to.equal('');
    
    // Should not pollute the parent
    doc = new User();
    expect(doc.get('username')).to.equal('');
    expect(doc.get('class')).to.equal(undefined);
  });
  
  it('should nest', function() {
    var User = model
      .attr('name', model
        .attr('familyName', 'string'));
      
    var doc = new User();
    doc.set('name.familyName', 'test');
    expect(doc.get('name.familyName')).to.equal('test');
  });
});