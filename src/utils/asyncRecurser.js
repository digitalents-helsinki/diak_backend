module.exports = (array, callback) => new Promise((resolve, reject) => {
  try {
    (function asyncRecurse(array, callback, promises = [], index = 0) {
      const curr = array[Number(index)]
      if (curr) {
        Promise.resolve(callback(curr, promises)).catch(reject)
        setImmediate(asyncRecurse, array, callback, promises, index + 1)
      } else {
        resolve(Promise.all(promises))
      }
    })(array, callback)
  } catch(err) {
    reject(err)
  }
})

/*  
  Executes a callback function for each array member
  (member, promises) => {
    do things with member 
    promises.push(<Promise>)
  }
  Each promise in promises array is awaited for at the end
*/