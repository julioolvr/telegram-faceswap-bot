export function shuffleArray(baseArray) {
  // From https://www.frankmitchell.org/2015/01/fisher-yates/
  let i = 0,
    j = 0,
    temp = null,
    array = baseArray.slice()

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }

  return array
}
