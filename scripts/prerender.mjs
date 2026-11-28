// "vite build" ke baad chalta hai: har page ki asli HTML (title, description, content, JSON-LD) banata hai,
// plus sitemap.xml aur robots.txt. Domain badalne ke liye SITE_URL environment variable set karen.
import fs from 'node:fs'
import path from 'node:path'
import { PAGES, HOME, SITE_NAME, pageMeta, jsonLd } from '../src/seo.js'

const SITE = (process.env.SITE_URL || 'https://youlovepdfedit.vercel.app').replace(/\/$/, '')
const dist = path.resolve('dist')
const tpl = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const nav = '<nav>' + [['/', SITE_NAME], ...PAGES.map(p => ['/' + p.slug, p.name])].map(([h, n]) => `<a href="${h}">${esc(n)}</a>`).join(' ') + '</nav>'

function render(meta, url, body, ld) {
  return tpl
    .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', [
      `<meta name="description" content="${esc(meta.description)}">`,
      `<link rel="canonical" href="${url}">`,
      '<meta property="og:type" content="website">',
      `<meta property="og:title" content="${esc(meta.title)}">`,
      `<meta property="og:description" content="${esc(meta.description)}">`,
      `<meta property="og:url" content="${url}">`,
      '<meta name="twitter:card" content="summary">',
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
      '</head>'
    ].join('\n'))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

const write = (rel, html) => {
  const file = path.join(dist, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
}

// Home
const homeBody = `${nav}<main><h1>${esc(HOME.h1)}</h1><p>${esc(HOME.intro)}</p><ul>` +
  PAGES.map(p => `<li><a href="/${p.slug}">${esc(p.name)}</a>: ${esc(pageMeta(p).description)}</li>`).join('') + '</ul></main>'
write('index.html', render(HOME, SITE + '/', homeBody, jsonLd(null, SITE + '/')))

// Har tool page
for (const p of PAGES) {
  const m = pageMeta(p), url = `${SITE}/${p.slug}`
  const body = `${nav}<main><h1>${esc(m.h1)}</h1><p>${esc(m.intro)}</p>` +
    `<h2>How to use ${esc(p.name)}</h2><ol>${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` +
    `<h2>Frequently asked questions</h2>${m.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</main>`
  write(`${p.slug}/index.html`, render(m, url, body, jsonLd(p, url)))
}

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ['', ...PAGES.map(p => p.slug)].map(s => `  <url><loc>${SITE}/${s}</loc></url>`).join('\n') + '\n</urlset>\n')
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`Prerendered ${PAGES.length + 1} pages for ${SITE}`)
