#! /usr/bin/env node

'use strict';

function showUsage() {
  return console.log('Usage: itpub <cmd> [url|keywords]');
}

function showVersion() {
  return console.log(require('./package').version);
}


var ITPubClient = require('./lib/itpub-crawler');
var config = require('./itpub.json');
var client = new ITPubClient(config);
var args = process.argv;
var cmd = args[2];

var handlers = {
  '-h': showUsage,
  '--help': showUsage,
  '-v': showVersion,
  '--version': showVersion,
  'ls': function() {
    var url = args[3];
    var onlyAttachments = args[4];
    console.log('Listing attachments ...');
    client.listThread(url, function(err, results) {
      if (err) {
        throw err;
      }
  
      results.forEach(function(result) {
        if (!onlyAttachments) {
          console.log('%s - %s', result.link.href, result.link.text);
        }
        result.links.forEach(function(link) {
          console.log('    %s - %s', link.href, link.text);
        });
      });
    });
  },  
  'list': function() {
    var url = args[3];
    var onlyAttachments = args[4];
    console.log('Listing forum ...');
    client.listForumThreads(url, function(err, results) {
      if (err) {
        throw err;
      }
  
      results.forEach(function(result) {
        if (!onlyAttachments) {
          console.log('%s - %s', result.link.href, result.link.text);
        }
        result.links.forEach(function(link) {
          console.log('    %s - %s', link.href, link.text);
        });
      });
    });
  },
  'listfrom': function() {
    var filepath = args[3];
    var onlyAttachments = args[4];
    console.log('Listing from file ...');
    client.listForumThreadsFromFiles(filepath, function(err, results) {
      if (err) {
        throw err;
      }
  
      results.forEach(function(result) {
        if (!onlyAttachments) {
          console.log('%s - %s', result.link.href, result.link.text);
        }
        result.links.forEach(function(link) {
          console.log('    %s - %s', link.href, link.text);
        });
      });
    });
  },
  'search': function() {
    var keywords = args[3];
    console.log('Searching ...');
    client.searchThreads(keywords, function(err, data) {
      if (err) {
        throw err;
      }
  
      console.log(data);
    });
  },
  'threads': function() {
    console.log('Fetching ...');
    client.totalThreads(function(err, data) {
      if (err) {
        throw err;
      }
  
      console.log('Total threads: %s', data);
    });
  },
  'typeid': function() {
    console.log('Filtering ...');
    console.log('You can also trying other types: ', client.itpubTypes());
    var typeid = args[3] || 385;
    client.pagesOfType(typeid, function(err, data) {
      if (err) {
        throw err;
      }
  
      console.log('Total pages of type %s: %s', typeid, data);
    });
  },
};

handlers[cmd || '-h'].call();
