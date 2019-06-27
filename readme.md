# Any CSV buffer to UTF8
Any CSV buffer to UTF8 converter

### Install
```bash
$ npm install any-to-utf8
```

### Usage
```js
const anyToUtf8 = require('any-to-utf8')

anyToUtf8(csvBuffer)
  .then(csvUtf8 => {
    // handle output
  }).catch(error => {
    // handler error
  })
```