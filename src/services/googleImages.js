import got from 'got'

function randomSearchKey() {
  const keys = process.env.GOOGLE_SEARCH_KEY.split(';')
  return keys[Math.floor(Math.random() * keys.length)]
}

export const search = (query) => {
  const url =
    `https://www.googleapis.com/customsearch/v1?key=${randomSearchKey()}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image`

  return got(url, { json: true })
    .then(response => response.body)
    .then(data => data.items ? data.items : [])
    .then(items => items.map(item => item.link))
}
