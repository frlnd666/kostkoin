import { useEffect } from 'react'

interface OgMeta {
  title:       string
  description: string
  image?:      string
  url?:        string
}

export const useOgMeta = ({ title, description, image, url }: OgMeta) => {
  useEffect(() => {
    const set = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    const setName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    const fullUrl = url || window.location.href
    const imgUrl  = image || 'https://kostkoin.vercel.app/pwa-512x512.png'

    document.title = `${title} — KostKoin`

    set('og:title',       title)
    set('og:description', description)
    set('og:image',       imgUrl)
    set('og:url',         fullUrl)
    set('og:type',        'website')
    set('og:site_name',   'KostKoin')

    setName('twitter:card',        'summary_large_image')
    setName('twitter:title',       title)
    setName('twitter:description', description)
    setName('twitter:image',       imgUrl)
    setName('description',         description)
  }, [title, description, image, url])
}
