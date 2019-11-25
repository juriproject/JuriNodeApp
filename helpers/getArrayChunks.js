const CHUNK_LENGTH = 20 // TODO

const getArrayChunks = array =>
  Array(Math.ceil(array.length / CHUNK_LENGTH))
    .fill()
    .map((_, index) => index * CHUNK_LENGTH)
    .map(begin => array.slice(begin, begin + CHUNK_LENGTH))

module.exports = { getArrayChunks, CHUNK_LENGTH }
