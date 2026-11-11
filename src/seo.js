// SEO data: har tool page ka title/description/content. Browser app aur scripts/prerender.mjs dono isko use karte hain.
export const SITE_NAME = 'PDF Editor'

export const HOME = {
  title: 'PDF Editor – Free Online PDF Tools, No Login',
  description: 'Merge, split, edit and convert PDF files online for free. No sign-up, and your files never leave your browser.',
  h1: 'Every PDF tool, in one place',
  intro: 'Merge, split, edit, convert and more. No login needed, and your files never leave your browser.'
}

// id = catalog.js ka tool id, slug = page ka URL (/slug)
const P = (id, slug, name, what, note, steps) => ({ id, slug, name, what, note, steps })
const STEPS = ['Choose your file or files.', 'Set any options you need.', 'Run the tool and download the result.']

export const PAGES = [
  P('merge', 'merge-pdf', 'Merge PDF', 'combine several PDF files into one document', 'Add your PDF files in the order you want. They are joined in that order into a single PDF.'),
  P('split', 'split-pdf', 'Split PDF', 'split a PDF into separate files by page or page range', 'Split every page into its own file, or enter ranges like 1-3, 5. Multiple results download as one ZIP file.'),
  P('remove', 'remove-pdf-pages', 'Remove PDF Pages', 'delete unwanted pages from a PDF', 'Enter the pages to delete, for example 1, 3-5. The remaining pages are saved as a new PDF.'),
  P('extract', 'extract-pdf-pages', 'Extract PDF Pages', 'create a new PDF that contains only the pages you choose', 'Enter the pages to keep, for example 1-3, 7. They are saved as a new PDF.'),
  P('rotate', 'rotate-pdf', 'Rotate PDF', 'rotate all or selected pages of a PDF', 'Rotate by 90, 180 or 270 degrees. Leave the pages field empty to rotate every page.'),
  P('numbers', 'add-page-numbers-to-pdf', 'Add Page Numbers to PDF', 'add page numbers to every page of a PDF', 'Choose where the numbers appear and which number to start from.'),
  P('watermark', 'add-watermark-to-pdf', 'Add Watermark to PDF', 'stamp a text watermark on every page of a PDF', 'Type your watermark text, choose its size and opacity, and it is placed diagonally on every page.'),
  P('edit', 'edit-pdf', 'Edit PDF', 'add text and images to a PDF, or change and delete existing text', 'Add text boxes and images, drag them into place, and use undo and redo. Turn on Edit existing text to change what is already on the page.',
    ['Open your PDF file.', 'Add or change text and images, with undo and redo.', 'Download the edited PDF.']),
  P('from-docx', 'pdf-to-word', 'PDF to Word', 'convert a PDF to an editable Word (.docx) document', 'Tables are detected and rebuilt as real Word tables. Scanned PDFs contain no text, and OCR is not supported yet.'),
  P('from-xlsx', 'pdf-to-excel', 'PDF to Excel', 'extract the data of a PDF into Excel (.xlsx) sheets', 'Each page becomes a sheet, and text is split into columns. Scanned PDFs are not supported yet.'),
  P('from-pptx', 'pdf-to-powerpoint', 'PDF to PowerPoint', 'convert a PDF to PowerPoint slides with editable text', 'Each page becomes a slide with text boxes you can edit.'),
  P('from-pptx-img', 'pdf-to-powerpoint-images', 'PDF to PowerPoint (Images)', 'turn every PDF page into a PowerPoint slide that looks exactly like the page', 'Each page becomes one slide with the page as an image, so the look is preserved but the text is not editable.'),
  P('from-jpg', 'pdf-to-jpg', 'PDF to JPG', 'convert each page of a PDF to a JPG image', 'Every page is saved as a JPG image. Multi-page PDFs download as one ZIP file.'),
  P('from-png', 'pdf-to-png', 'PDF to PNG', 'convert each page of a PDF to a PNG image', 'Every page is saved as a PNG image. Multi-page PDFs download as one ZIP file.'),
  P('to-docx', 'word-to-pdf', 'Word to PDF', 'convert a Word (.docx) document to PDF', 'Text, headings, lists and tables are converted. Images are not included yet, and only .docx files are supported.'),
  P('to-xlsx', 'excel-to-pdf', 'Excel to PDF', 'convert an Excel or CSV file to PDF', 'Every sheet is converted to a table in the PDF. Supports .xlsx, .xls and .csv files.'),
  P('to-pptx', 'powerpoint-to-pdf', 'PowerPoint to PDF', 'convert a PowerPoint (.pptx) presentation to PDF', 'The text of each slide is placed on its own PDF page. Only .pptx files are supported.'),
  P('to-image', 'jpg-to-pdf', 'JPG to PDF', 'combine one or more images into a single PDF', 'Each image becomes one page of the PDF. JPG, PNG and WebP images are supported.')
]

export const pageMeta = p => ({
  title: `${p.name} Online – Free, No Login | ${SITE_NAME}`,
  description: `Easily ${p.what}. Free, no sign-up, and your files are processed in your browser, never uploaded.`,
  h1: `${p.name} Online`,
  intro: `Use this free tool to ${p.what}. It runs in your browser, so your files stay on your device.`,
  steps: p.steps || STEPS,
  faq: [
    [`Is ${p.name} free?`, 'Yes. It is free to use and does not require an account or login.'],
    ['Are my files uploaded to a server?', 'No. Your files are processed in your browser and never leave your device.'],
    [`How does ${p.name} work?`, p.note]
  ]
})

export function jsonLd(p, url) {
  if (!p) return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url }
  const m = pageMeta(p)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: p.name, url, description: m.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'FAQPage', mainEntity: m.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  }
}
