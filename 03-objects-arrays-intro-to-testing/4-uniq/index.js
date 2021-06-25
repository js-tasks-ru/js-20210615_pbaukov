/**
 * uniq - returns array of uniq values:
 * @param {*[]} arr - the array of primitive values
 * @returns {*[]} - the new array with uniq values
 */
export function uniq(arr) {
  const result = new Set();
  if (!arr) {
    return [];
  }
  arr.forEach(entry => result.add(entry));
  return Array.from(result);
}
