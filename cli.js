#! /usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var args = process.argv;
var cmd = args[2];
var cfgFile = '.itpub.json';
var cfgPath = path.join(process.env.HOME, cfgFile);

function showUsage() {
  var usage = [
    'Usage: itpub <cmd> [url|keywords]',
    '    -h                     Show usage',
    '    --help                 Show usage',
    '    -v                     Show version',
    '    -version               Show version',
    '    config username "your name" password "your password"   set config',
    '    showconfig             Show config in ~/.itpub.json',
    '    ls  <url> <only>       List thread',
    '    list  <url> <only>     Show forum threads',
    '    listfrom  <filepath> <only> Show forum threads from file',
    '    search  <keywords>     Search forum threads',
    '    threads                Total threads',
    '    typeid  <typeid>       Show pages of threads filtered by typeid',
    ''
  ];
  return console.log(usage.join('\n'));
}

function showVersion() {
  return console.log(require('./package').version);
}

function loadConfig(cfgPath) {
  try {
    return require(cfgPath);
  } catch(e) {
    return {};
  }
}

function setConfig() {
  var kvs = args.slice(3);
  var cfg = loadConfig(cfgPath);
  for (var i = 0; i < kvs.length; i+=2) {
    cfg[kvs[i]] = kvs[i+1];
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg));
  return cfg;
}

var ITPubClient, config, client;
try {
  ITPubClient = require('itpub-crawler');
  config = loadConfig(cfgPath);
} catch(e) {
  ITPubClient = require('./lib/itpub-crawler');
  config = require('./itpub.json');
}

try {
  client = new ITPubClient(config);
} catch(e) {
  if (cmd !== 'config') {
    console.error('Invalid username or password.\nitpub config username "your name" password "your password"');
    process.exit(-1);
  }
}

function showResult(result, onlyAttachments) {
  if (!result.links || result.links.length === 0) {
    return;
  }
  console.log(' <li data-href="%s" data-text="%s">', onlyAttachments ? result.link.href : '', result.link.text);
  console.log('  <ul>');
  result.links.forEach(function(link) {
    console.log('   <li><a href="%s">%s</a></li>', link.href, link.text);
  });
  console.log('  </ul>');
  console.log(' </li>');
}

function showResults(results, onlyAttachments) {
  if (!results || results.length === 0) {
    return;
  }
  
  console.log('<ul>');
  results.forEach(function(result) {
    showResult(result, onlyAttachments);
  });
  console.log('</ul>');
}

var handlers = {
  '-h': showUsage,
  '--help': showUsage,
  '-v': showVersion,
  '--version': showVersion,
  'config': setConfig,
  'showconfig': function() {
    var cfg = loadConfig(cfgPath);
    console.log('Config: %s', JSON.stringify(cfg));
  },
  'ls': function() {
    var url = args[3];
    var onlyAttachments = args[4] || true;
    console.log('Listing attachments ...');
    client.listThread(url, function(err, results) {
      if (err) {
        throw err;
      }
  
      showResults(results, onlyAttachments);
    });
  },  
  'list': function() {
    var url = args[3];
    var onlyAttachments = args[4] || true;
    console.log('Listing forum ...');
    client.listForumThreads(url, function(err, results) {
      if (err) {
        throw err;
      }
  
      showResults(results, onlyAttachments);
    });
  },
  'listfrom': function() {
    var filepath = args[3];
    var onlyAttachments = args[4] || true;
    console.log('Listing from file ...');
    client.listForumThreadsFromFiles(filepath, function(err, results) {
      if (err) {
        throw err;
      }
  
      showResults(results, onlyAttachments);
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
