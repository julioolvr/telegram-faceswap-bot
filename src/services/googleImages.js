import got from 'got'

export const search = (query) => {
  const url =
    `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_KEY}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`

  return got(url, { json: true })
    .then(response => response.body)
    .then(data => data.items ? data.items : [])
    .then(items => items.map(item => item.pagemap.imageobject[0]))
    .then(imageObjects => imageObjects.map(imageObject => imageObject.url || imageObject.contenturl))
    .then(imagesUrls => imagesUrls.filter(url => url))
}
