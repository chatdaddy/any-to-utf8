const { ReadableStreamBuffer, WritableStreamBuffer } = require('stream-buffers')
const { Iconv } = require('iconv')
const iconvLite = require('iconv-lite')
const ced = require('ced')
const _ = require('lodash')

const CONVERTERS = [
  (charsetFrom, charsetTo) => stream => stream.pipe(iconvLite.decodeStream(charsetFrom)).pipe(iconvLite.encodeStream(charsetTo)),
  (charsetFrom, charsetTo) => stream => stream.pipe(new Iconv(charsetFrom, charsetTo))
]

const bufferedEncoder = (buffer, converter) => new Promise((resolve, reject) => {
  try {
    var charsetMatch = ced(buffer)
    if (!charsetMatch) {
      throw new Error('No encoding matched')
    }
    charsetMatch = _.includes(charsetMatch, 'ASCII', 'ascii') ? 'ASCII' : charsetMatch
    const charsetConverter = converter(charsetMatch, 'utf8')
    const myReadableStreamBuffer = new ReadableStreamBuffer({
      chunkSize: 65536 // 64kb
    })
    const myWritableStreamBuffer = new WritableStreamBuffer({
      initialSize: 65536, // 64kb
      incrementAmount: 65536 // 64kb
    })
    charsetConverter(myReadableStreamBuffer)
      .on('error', err => reject(err))
      .pipe(myWritableStreamBuffer)
      .on('error', err => reject(err))
      .on('finish', () => resolve(myWritableStreamBuffer.getContents()))
    myReadableStreamBuffer.put(buffer)
    myReadableStreamBuffer.stop()
  } catch (e) {
    reject(e)
  }
})

const anyToUtf8 = async (buffer) => {
  for (let converter of CONVERTERS) {
    try {
      const resultBuffer = await bufferedEncoder(buffer, converter)
      return resultBuffer
    } catch (e) {}
  }
}

module.exports = anyToUtf8
