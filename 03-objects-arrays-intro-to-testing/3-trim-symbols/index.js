/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) {
    return '';
  }
  return string.split('').reduce((accumulator, letter) => {
    accumulator.currentSize = accumulator.currentSize && accumulator.symbol === letter ? ++accumulator.currentSize : 1;
    accumulator.symbol = letter;
    if (!size || accumulator.currentSize <= size) {
      accumulator.output += letter;
    }
    return accumulator;
  }, {
    output: ''
  }).output;
}
