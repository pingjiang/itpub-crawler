/*
 * 
 * https://github.com/pingjiang
 *
 * Copyright (c) 2014 pingjiang
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var extend = require('util')._extend;
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var ITPUB_URL_BASE = "http://www.itpub.net/";
var ITPUB_URL_BOOKS = ITPUB_URL_BASE + "forum-61-1.html";
var ITPUB_LOGIN_URL = ITPUB_URL_BASE + "member.php?mod=logging&action=login&loginsubmit=yes&infloat=yes&lssubmit=yes&inajax=1";
var ITPUB_SEARCH_URL = ITPUB_URL_BASE + "search.php?searchsubmit=yes";
var ITPUB_URL_FILTER = ITPUB_URL_BASE + "forum.php?mod=forumdisplay&fid=61&filter=typeid&typeid=";

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
  
  this.preferEncoding = this.defaults.preferEncoding || 'utf8';
  this.requestor = request.defaults(opts);
  this.logon = false;
}

extend(ITPubClient.prototype, {
  convertUrl: function(url) {
    return url.replace('[^\/].*tid=([0-9]+)$', 'thread-\\1-1-1.html');
  },
  crackUrl: function(url) {
    return url.replace("attachment.php?", "forum.php?mod=attachment&").replace("&amp;", "&");
  },
  expandUrl: function(line) {
    var RE_RANGE = /\[(\d+)\-(\d+)\]/;
    var matched = RE_RANGE.exec(line);
    if (matched && matched.length === 3) {
      var min = parseInt(matched[1]), max = parseInt(matched[2]);
      var urls = [];
      for (var i = min; i <= max; i++) {
        var url = line.replace(RE_RANGE, i);
        urls.push(url);
      }
      
      return urls;
    }
    
    return [line];
  },
  itpubTypes: function() {
    return {
      "1795": "ERP",  
      "1796": "软件测试",  
      "1797": "网页设计",  
      "1798": "移动平台",  
      "1799": "项目管理",  
      "1800": "软件工程",  
      "1801": "操作系统",  
      "1802": "OFFICE",  
      "1803": "嵌入式开发",  
      "1804": "其他资料",  
      "385": "精华",  
      "386": "FAQ",  
      "387": "Tips",  
      "388": "笔记",  
      "389": "原创",  
      "390": "范例",  
      "391": "工具",  
      "392": "转载",  
      "393": "参考文档",
      "394": "ITPUB培训",  
      "395": "java基础",  
      "396": "java框架",  
      "397": "J2EE",  
      "398": "J2ME",  
      "399": "分析设计",  
      "400": "C/C++",  
      "401": "数据库设计",  
      "402": "数据库管理",  
      "403": "数据库优化"
    };
  }
});

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
      console.error('iconv convert to %s null', contentEncoding);
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

ITPubClient.prototype.doRequestAndSelect = function(url, selector, done) {
  this.doRequest('get', url, function(err, res, data) {
    if (err) {
      return done(err);
    }
    
    var $ = cheerio.load(data);
    var elem = $(selector);
    done(null, elem);
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

ITPubClient.prototype.listThread = function(url, done) {
  var self = this;
  self.doService(function(err) {
    if (err) {
      return done(err);
    }
    self.searchThreadAttachments('unknown', {href: url, text: 'unknown'}, function(err, threadUrl, link, links) {
      done(null, [{ thread: threadUrl, link: link, links: links }]);
    });
  });
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

ITPubClient.prototype.totalThreads = function(done) {
  var self = this;
  self.doService(function(err) {
    if (err) {
      return done(err);
    }
    
    self.doRequestAndParseLinks(ITPUB_URL_BOOKS, 'a.last', function(err, res, links) {
      if (err) {
        return done(err);
      }
      var linkLast = links.length > 0 ? links[0].text : '';
      if (linkLast.indexOf('... ') === 0) {
        linkLast = linkLast.substring(4);
      }
      done(null, linkLast);
    });
  });
};

ITPubClient.prototype.pagesOfType = function(typeid, done) {
  var self = this;
  self.doService(function(err) {
    if (err) {
      return done(err);
    }
    
    typeid = typeid || 385; // 精华
    var url = ITPUB_URL_FILTER + typeid;
    self.doRequestAndParseLinks(url, 'div#pgt .pg a', function(err, res, links) {
      if (err) {
        return done(err);
      }
      
      if (links && links.length) {
        var rangeUrl = url + '&page=[1-' + links.length + ']';
        done(null, rangeUrl);
      } else {
        done (null, links.length);
      }
    });
  });
};

ITPubClient.prototype.listForumThreadsFromFiles = function(filepath, done) {
  var self = this;
  fs.readFile(filepath, {
    encoding: 'utf8'
  }, function(err, data) {
    var lines = data.split('\n');
    lines.forEach(function(line) {
      line = line.trim();
      if (line.length === 0 || line.indexOf('#') === 0) {
        return;
      }
      
      var urls = self.expandUrl(line);
      urls.forEach(function(url) {
        self.listForumThreads(url, done);
      });
    });
  });
};

ITPubClient.prototype.searchThreads = function(keyword, done) {
  var self = this;
  self.doService(function(err) {
    if (err) {
      return done(err);
    }
    
    self.doRequestAndSelect(ITPUB_URL_BOOKS, 'form#scbar_form input[name=formhash]', function(err, elem) {
      if (err) {
        return done(err);
      }
      
      var formhash = elem.val();
      var form = {
        "formhash": formhash, 
        "mod": "curforum", 
        "searchsubmit": "true", 
        "srchtxt": keyword, 
        "srchtype": "title", 
        "srhfid": "61", 
        "srhlocality": "forum::forumdisplay"
      };
      
      // do search
      self.doRequest('post', ITPUB_SEARCH_URL, {
        form: form
      }, function(err, res, data) {
        if (err) {
          return done(err);
        }
    
        // handle search result
        var $ = cheerio.load(data);
        var resultElem = $('div#main div.result');
        var elem = $('div.allnum', resultElem);
        if (!elem || elem.length === 0) {
          elem = $('div.no-result>p', resultElem);
        }
        done(null, elem.text());
      });
    });
  });
};

module.exports = ITPubClient;
