/*global describe,it*/
'use strict';
var assert = require('assert'),
  config = require('../itpub.json'),
  ITPubClient = require('../lib/itpub-crawler.js');

var client = new ITPubClient(config);
  
describe('itpub-crawler node module.', function() {
  this.timeout(60000);
  it('must be array', function(done) {
    client.listForumThreads(null, function(err, results) {
      assert.equal(null, err);
      assert(results.length > 0);
      done();
    });
  });
});
