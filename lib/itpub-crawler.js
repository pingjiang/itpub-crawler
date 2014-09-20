/*
 * 
 * https://github.com/pingjiang
 *
 * Copyright (c) 2014 pingjiang
 * Licensed under the MIT license.
 */

'use strict';

var extend = require('util')._extend;
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var ITPUB_URL_BASE = "http://www.itpub.net/";
// var ITPUB_URL = ITPUB_URL_BASE + "forum.php";
var ITPUB_URL_BOOKS = ITPUB_URL_BASE + "forum-61-1.html";
var ITPUB_LOGIN_URL = ITPUB_URL_BASE + "member.php?mod=logging&action=login&loginsubmit=yes&infloat=yes&lssubmit=yes&inajax=1";
// var USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0";
// var HTTP_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
// var REGEX_LINK = "a[href^=forum.php?mod=viewthread][class=xst],a[href^=thread-][class=xst]";
// var REGEX_SEARCH_LINK = "a[href*=forum.php?mod=viewthread]";
// var REGEX_ITPUB_ATTACHMENT = "a[href^=attachment.php?aid=]";

function ITPubClient(username, password, defaults) {
  if (typeof username === 'object') {
    this.defaults = defaults = username;
    this.username = defaults.username; delete defaults.username;
    this.password = defaults.password; delete defaults.password;
  } else {
    this.defaults = defaults || {};
    this.username = username;
    this.password = password;
  }
  
  if (!this.username && !this.password) {
    throw new Error('ITPub username or password is null');
  }
  
  var opts = extend({
    jar: true,
    encoding: null
  }, this.defaults);
  
  this.preferEncoding = this.defaults.preferEncoding || 'gbk';
  this.requestor = request.defaults(opts);
  this.logon = false;
  
  this.convertUrl = function(url) {
    return url.replace('[^\/].*tid=([0-9]+)$', 'thread-\\1-1-1.html');
  };
  this.crackUrl = function(url) {
    return url.replace("attachment.php?", "forum.php?mod=attachment&").replace("&amp;", "&");
  };
}

ITPubClient.prototype.doRequest = function(method, url, options, done) {
  var self = this;
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  
  var opts = extend({
    method: method,
    url: url
  }, options);
  
  self.requestor(opts, function(err, res, buf) {
    if (err) {
      return done(err, res, buf);
    }
    // handle >= 400 status code
    
    // handle encoding
    var contentType = res.headers['content-type'];
    var RE_CONTENT_ENCODING = /.*charset=([\w\d-]+)/i;
    var matched = RE_CONTENT_ENCODING.exec(contentType);
    var contentEncoding = matched && matched.length ===2 ? matched[1] : self.preferEncoding;
    var data = iconv.decode(buf, contentEncoding).toString();
    if (!data) {
      data = buf; // convert error, fallback to raw buffer data
    }
    
    done(err, res, data);
  });
};

ITPubClient.prototype.login = function(done) {
  var self = this;
  var form = {
    fastloginfield: 'username',
    username: this.username,
    password: this.password,
    quickforward: 'yes',
    handlekey: 'ls'
  };
  
  this.doRequest('post', ITPUB_LOGIN_URL, {
    form: form
  }, function(err) {
    if (err) {
      return done(err);
    }
    
    self.logon = true;
    done(null);
  });
};

ITPubClient.prototype.doRequestAndParseLinks = function(url, pattern, done) {
  var self = this;
  this.doRequest('get', url, function(err, res, data) {
    if (err) {
      return done(err);
    }
    
    var $ = cheerio.load(data);
    var links = $(pattern);
    var results = [];
    links.each(function() {
      results.push({ href: ITPUB_URL_BASE + self.crackUrl($(this).attr('href')), text: $(this).text() });
    });
    done(null, res, results);
  });
};

ITPubClient.prototype.searchThreadAttachments = function(threadUrl, link, done) {
  this.doRequestAndParseLinks(link.href, 'div#postlist a[href^="attachment.php?"]', function(err, res, links) {
    if (err) {
      return done(err);
    }
    done(null, threadUrl, link, links);
  });
};

ITPubClient.prototype.doService = function(done) {
  var self = this;
  if (!self.logon) {
    self.login(function(err) {
      if (err) {
        return done(err);
      }
      
      done(null);
    });
    
    return;
  }
  
  done(null);
};

ITPubClient.prototype.listForumThreads = function(url, done) {
  var self = this;
  self.doService(function(err) {
    if (err) {
      return done(err);
    }
    
    url = url ? self.convertUrl(url) : ITPUB_URL_BOOKS;
    self.doRequestAndParseLinks(url, 'div#threadlist a.xst', function(err, res, links) {
      if (err) {
        return done(err);
      }
      links = links || [];
      var count = links.length, results = [], finished = function(err, threadUrl, link, links) {
        results.push({ thread: threadUrl, link: link, links: links });
        if (--count <= 0) {
          done(null, results);
        }
      };
    
      links.forEach(function(link) {
        self.searchThreadAttachments(url, link, finished);
      });
    });
  });
};

module.exports = ITPubClient;
