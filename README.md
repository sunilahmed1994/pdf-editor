# PDF Editor (React + Vite)

Browser me chalne wala PDF editor. Login nahi, server nahi: file user ke browser me hi rehti hai.

## Features
- PDF upload (button ya drag & drop)
- Text aur picture add karna, hilana, size badalna
- Undo / Redo (Ctrl+Z, Ctrl+Y) aur Delete (Delete key ya button)
- PDF ka maujooda text badalna ya mitana ("Mojooda text edit" button, phir text par click)
- Edited PDF download
- Home page par iLovePDF jaisa tools grid (tabs ke sath): Merge, Split, Remove/Extract pages, Rotate, Page numbers, Watermark, Edit PDF aur saari conversions. Jald aane wale tools (Organize, Compress, OCR, Crop, Protect, Unlock, Sign, Redact, Translate) "Jald aa raha hai" ke badge ke sath dikhte hain
- Naya tool jodne ke liye: src/catalog.js me card likhen, src/tools.js me uska function
- Convert (toolbar ya pehli screen par "Convert"): PDF se Picture (PNG/JPG), Word, Excel, PowerPoint; aur Picture/Word/Excel/PowerPoint se PDF (banne ke baad PDF editor me khul jati hai)
- Page ko PNG me aur poori PDF ka text .txt me convert karna

## Computer par chalane ka tareeqa
1. Node.js (version 18+) install karen: https://nodejs.org
2. Is folder me terminal kholen aur chalayen:
   npm install
   npm run dev
3. Browser me jo link aye (jaise http://localhost:5173) kholen.

## Online karne ka tareeqa
1. npm run build chalayen (dist folder banta hai).
2. Project GitHub par upload karen, phir Vercel ya Netlify par "Import project" karen.
   Build command: npm run build   |   Output folder: dist
   Har update par site khud update ho jati hai.

## Files kya karti hain
- src/App.jsx: upload, toolbar, undo/redo, download aur convert ka poora logic
- src/PageView.jsx: ek page dikhana, objects ko drag/resize karna
- src/styles.css: design

## Abhi ki hadood (baad me add ho sakti hain)
- Text sirf English/Latin letters me PDF me save hota hai (Urdu font embed karna agla step hai)
- Maujooda text badalte waqt purane text par rang ka dabba (whiteout) lagta hai aur naya text uske upar likha jata hai. Purana text file ke andar chhupa rehta hai (copy/search me aa sakta hai), asli redaction nahi hai
- Naya text Helvetica font me aata hai, original font nahi; tirchha/ghoomta hua text abhi support nahi
- Maujooda pictures abhi edit/delete nahi hoti
- Conversion text par mabni hai: layout, tables, pictures aur fonts poori tarah nahi bachte. Scanned PDF (sirf tasveer) se Word/Excel nahi banta (OCR nahi hai). PowerPoint (page ki tasveer) exact dikhta hai magar edit nahi hota
- Sirf naye formats (.docx, .xlsx, .pptx) chalte hain, purane .doc/.ppt nahi. Word se PDF me pictures nahi aati
- Behtar quality ke liye baad me backend (LibreOffice) lagana parega
- PDF se Word: tables (aapas me aligned text) asli Word tables ban jati hain, page size/margin, indent aur center/right alignment bhi bachte hain. Bold/rang, pictures, merged cells aur multi-column layout abhi nahi bachte
- Word/Excel conversion ke liye backend chahiye

## SEO (search engine ranking)
- Har tool ka apna URL hai (/merge-pdf, /pdf-to-word wagera). Title, description, content, FAQ aur JSON-LD src/seo.js me hain.
- `npm run build` ke baad scripts/prerender.mjs har page ki asli HTML, sitemap.xml aur robots.txt dist me bana deta hai.
- Apna asli domain dene ke liye hosting me environment variable SITE_URL set karen (jaise https://aapkadomain.com). Warna sitemap me https://example.com rahega.
- Naya tool page jodne ke liye: src/catalog.js me card, src/seo.js me page entry.
- Live hone ke baad Google Search Console aur Bing Webmaster Tools me site add karke sitemap.xml submit karen.
- Hosting par har /slug ka alag index.html chahiye hota hai, jo prerender script khud banata hai.
