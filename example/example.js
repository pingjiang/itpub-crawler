'use strict';

var config = require('../itpub.json');
var ITPubClient = require('../lib/itpub-crawler.js');
var client = new ITPubClient(config);

console.log('Parsing ...');

client.listForumThreads(null, function(err, results) {
  if (err) {
    throw err;
  }
  
  results.forEach(function(result) {
    console.log('%s - %s', result.link.href, result.link.text);
    result.links.forEach(function(link) {
      console.log('    %s - %s', link.href, link.text);
    });
  });
});