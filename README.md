#  [ITPUB](http://www.itpub.net/forum-61-1.html) 附件下载神器 [![Build Status](https://secure.travis-ci.org/pingjiang/itpub-crawler.png?branch=master)](http://travis-ci.org/pingjiang/itpub-crawler)

## Getting Started

安装: `npm install itpub-crawler`

配置： `itpub config username "your name" password "your password"`

使用： `itpub list "http://www.itpub.net/forum-61-1.html" true > itpub.links.txt`

下载文件里面的链接： `itpub listfrom threads.txt`

threads.txt
```
#支持hash注释
http://www.itpub.net/forum-61-1.html
# 会自动忽略空行
#自动展开范围表示的链接
http://www.itpub.net/forum.php?mod=forumdisplay&fid=61&filter=typeid&typeid=385&page=[1-7]
```

*注意：*

* 如果链接比较多，会需要很长时间，所以最好将结果重定向到某个文件。
* 可以使用`JDownloader`下载全部链接。只需要将链接全部拷贝到内存，JDownloader就会自动识别所有下载链接了。
* 最后一个参数true表示只显示附件链接，专门用于JDownloader下载使用。
* 所有链接支持http://www.itpub.net/forum-61-[1-1789].html范围，会自动展开。


## 用做模块调用

```js
var config = require('../itpub.json');
var ITPubClient = require('../lib/itpub-crawler.js');
var client = new ITPubClient(config);
```

## 命令行调用

```sh
$ npm install -g itpub-crawler
$ itpub --help

Usage: itpub <cmd> [url|keywords]
    -h                     Show usage
    --help                 Show usage
    -v                     Show version
    -version               Show version
    ls  <url> <only>       List thread
    list  <url> <only>     Show forum threads
    listfrom  <filepath> <only> Show forum threads from file
    search  <keywords>     Search forum threads
    threads                Total threads
    typeid  <typeid>       Show pages of threads filtered by typeid
      
$ itpub --version
```

## Examples

### 列出forum所有thread中的附件

```
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


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 pingjiang  
Licensed under the MIT license.
