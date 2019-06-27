const { ReadableStreamBuffer, WritableStreamBuffer } = require('stream-buffers')
const { Iconv } = require('iconv')
const iconvLite = require('iconv-lite')

const detectCharacterEncoding = require('detect-character-encoding')

const CONVERTERS = [
  (charsetFrom, charsetTo) => stream => stream.pipe(iconvLite.decodeStream(charsetFrom)).pipe(iconvLite.encodeStream(charsetTo)),
  (charsetFrom, charsetTo) => stream => stream.pipe(new Iconv(charsetFrom, charsetTo))
]

const bufferedEncoder = (buffer, converter) => new Promise((resolve, reject) => {
  try {
    const charsetMatch = detectCharacterEncoding(buffer)
    if (!charsetMatch.encoding) {
      throw new Error('No encoding matched')
    }
    console.error('converting from', charsetMatch.encoding, 'to utf-8')
    const charsetConverter = converter(charsetMatch.encoding, 'utf8')
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
    console.error(e)
    reject(e)
  }
})

const anyToUtf8 = async (buffer) => {
  let attempts = 0
  for (let converter of CONVERTERS) {
    if (attempts) {
      console.error('Trying again...')
    }
    try {
      const resultBuffer = await bufferedEncoder(buffer, converter)
      return resultBuffer
    } catch (e) {
      console.error(`Attempt ${++attempts} failed.`)
    }
  }
}

module.exports = anyToUtf8
