#  [![Build Status](https://secure.travis-ci.org/pingjiang/itpub-crawler.png?branch=master)](http://travis-ci.org/pingjiang/itpub-crawler)

> [ITPUB](http://www.itpub.net/forum-61-1.html) 附件下载神器


## Getting Started

Install the module with: `npm install itpub-crawler`

```js
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
```

Install with cli command

```sh
$ npm install -g itpub-crawler
$ itpub --help
$ itpub --version
```


```sh
# creates a browser.js
$ grunt browserify
```



## Documentation

支持从文件读取链接：

```
http://www.itpub.net/forum-61-1.html

# 精华

http://www.itpub.net/forum.php?mod=forumdisplay&fid=61&filter=typeid&typeid=385&page=[1-7]

# thread页面

```


## Examples

_(Coming soon)_


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 pingjiang  
Licensed under the MIT license.
