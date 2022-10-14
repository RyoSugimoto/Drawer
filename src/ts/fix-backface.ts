const styleForFixed: {
  [key: string]: string
} = {
  height: '100vh',
  left: '0',
  overflow: 'hidden',
  position: 'fixed',
  width: '100vw',
}

const scrollingElement: Element = (() => {
  const ua = window.navigator.userAgent.toLowerCase()
  const d:Document = document
  if ('scrollingElement' in document) return document.scrollingElement!
  if (ua.indexOf('webkit') > 0) return d.body!
  return d.documentElement!
})()!

export default function fixBackface(fixed: boolean) {
  const scrollY:number = fixed ? scrollingElement.scrollTop : parseInt(document.body.style.top) ?? 0
  const scrollbarWidth:number = window.innerWidth - document.body.clientWidth
  document.body.style.top = fixed ? `-${scrollingElement.scrollTop}px` : ''
  document.body.style.paddingRight = fixed ? `${scrollbarWidth}px` : ''
  Object.keys(styleForFixed).forEach(key => {
    if (fixed) {
      document.body.style.setProperty(key, styleForFixed[key])
    } else {
      document.body.style.removeProperty(key)
    }
  })
  if (!fixed) scrollingElement.scrollTop = scrollY * -1
}
