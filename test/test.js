/*global describe,it*/
'use strict';
var assert = require('assert'),
  config = require('../itpub.json'),
  ITPubClient = require('../lib/itpub-crawler.js');

var client = new ITPubClient(config);
  
describe('itpub-crawler node module.', function() {
  this.timeout(60000);
  it('request threads', function(done) {
    client.listForumThreads(null, function(err, results) {
      assert.equal(null, err);
      assert(results.length > 0);
      done();
    });
  });
  
  it('utils expand', function() {
    var urls = client.expandUrl('http://www.itpub.net/forum-61-[1-1732].html');
    assert(urls.length > 0);
  });
  
  // pages of thread
  // http://www.itpub.net/thread-1890323-1-1.html
  // => 
  // http://www.itpub.net/thread-1890323-1-1.html
  
  // http://www.itpub.net/thread-1890250-1-1.html
  // =>
  // http://www.itpub.net/thread-1890250-[1-3]-1.html
  
  // http://www.itpub.net/thread-1761680-1-1.html
  // =>
  // http://www.itpub.net/thread-1761680-[1-291]-1.html
});
