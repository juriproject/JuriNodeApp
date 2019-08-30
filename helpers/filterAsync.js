const filterAsync = (array, filter) =>
  Promise.all(array.map(entry => filter(entry))).then(bits =>
    array.filter(() => bits.shift())
  )

module.exports = filterAsync
