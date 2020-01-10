module.exports = () => new Promise(resolve => 
  (async function asyncRecurseOverArray(array, callback, promises = [], index = 0) {
    const curr = array[Number(index)]
    if (curr) {
      callback(promises, curr, index)
      setImmediate(asyncRecurseOverArray, array, callback, promises, index + 1)
    } else {
      resolve(Promise.all(promises))
    }
  })()
)