/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const properties = path.split('.');
  return function myFunc(obj) {
    if (!properties || !properties.length) {
      return;
    }
    let i = 0;
    while (obj && i < properties.length) {
      obj = obj[properties[i]];
      i++;
    }
    return obj;
  };
}
