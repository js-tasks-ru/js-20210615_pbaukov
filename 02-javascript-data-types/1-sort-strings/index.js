/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  return arr.map(item => item).sort(compareWithOrder(param));
}

function compareWithOrder(order) {
  return function (a, b) {
    const symbolsToCompare = Math.min(a.length || 0, b.length || 0);
    let result = 0;
    let i = 0;
    while ((result === 0) && (i < symbolsToCompare)) {
      if (a[i].toLowerCase() !== b[i].toLowerCase()) {
        const aLetter = a[i].toLowerCase();
        const bLetter = b[i].toLowerCase();
        result = aLetter.localeCompare(bLetter);
      } else {
        result = a[i] > b[i] ? 1 : (a[i] < b[i] ? -1 : 0);
      }
      i++;
    }
    return order === 'desc' ? -result : result;
  }
}
