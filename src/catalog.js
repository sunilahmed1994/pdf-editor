export const CATS = [['all', 'All'], ['organize', 'Organize'], ['optimize', 'Optimize'], ['convert', 'Convert'], ['edit', 'Edit'], ['security', 'Security'], ['ai', 'AI']]
export const CATC = { organize: '#e8590c', optimize: '#2f9e44', convert: '#1c7ed6', edit: '#d6336c', security: '#0b7285', ai: '#f08c00' }

const PDF = 'application/pdf'
const R = (id, cat, icon, title, desc, kind, o = {}) => ({ id, cat, icon, title, desc, kind, ready: true, ...o })
const S = (id, cat, icon, title, desc) => ({ id, cat, icon, title, desc, ready: false }) // coming soon

export const TOOLS = [
  R('merge', 'organize', '⊕', 'Merge PDF', 'Combine multiple PDF files into one PDF.', 'tool'),
  R('split', 'organize', '✂', 'Split PDF', 'Split a PDF by page or by page ranges.', 'tool'),
  R('remove', 'organize', '✕', 'Remove pages', 'Delete unwanted pages from a PDF.', 'tool'),
  R('extract', 'organize', '⇥', 'Extract pages', 'Create a new PDF from selected pages.', 'tool'),
  S('organize', 'organize', '⇅', 'Organize PDF', 'Reorder the pages of a PDF.'),
  S('compress', 'optimize', '⇲', 'Compress PDF', 'Reduce the file size.'),
  S('ocr', 'optimize', 'Aa', 'OCR PDF', 'Make scanned PDFs searchable.'),
  R('from-docx', 'convert', 'W', 'PDF to Word', 'Convert PDF to Word (.docx), including tables.', 'from', { key: 'docx', accept: PDF }),
  R('from-xlsx', 'convert', 'X', 'PDF to Excel', 'Extract PDF data into Excel sheets.', 'from', { key: 'xlsx', accept: PDF }),
  R('from-pptx', 'convert', 'P', 'PDF to PowerPoint', 'Convert PDF to editable slides.', 'from', { key: 'pptx', accept: PDF }),
  R('from-pptx-img', 'convert', 'P', 'PDF to PowerPoint (picture)', 'One slide per page, exactly as it looks.', 'from', { key: 'pptx-img', accept: PDF }),
  R('from-jpg', 'convert', 'J', 'PDF to JPG', 'Turn each PDF page into a JPG image.', 'from', { key: 'jpg', accept: PDF }),
  R('from-png', 'convert', 'N', 'PDF to PNG', 'Turn each PDF page into a PNG image.', 'from', { key: 'png', accept: PDF }),
  R('to-docx', 'convert', 'W', 'Word to PDF', 'Convert a Word (.docx) file to PDF.', 'to', { key: 'docx', accept: '.docx' }),
  R('to-xlsx', 'convert', 'X', 'Excel to PDF', 'Convert an Excel or CSV file to PDF.', 'to', { key: 'xlsx', accept: '.xlsx,.xls,.csv' }),
  R('to-pptx', 'convert', 'P', 'PowerPoint to PDF', 'Convert a PowerPoint (.pptx) file to PDF.', 'to', { key: 'pptx', accept: '.pptx' }),
  R('to-image', 'convert', 'J', 'JPG to PDF', 'Combine one or more images into a PDF.', 'to', { key: 'image', accept: 'image/*', multi: true }),
  R('edit', 'edit', '✎', 'Edit PDF', 'Add text and images, or change and delete existing text.', 'edit', { accept: PDF }),
  R('rotate', 'edit', '⟳', 'Rotate PDF', 'Rotate all or selected pages.', 'tool'),
  R('numbers', 'edit', '#', 'Page numbers', 'Add page numbers to a PDF.', 'tool'),
  R('watermark', 'edit', '◈', 'Watermark', 'Add a text watermark to every page.', 'tool'),
  S('crop', 'edit', '⛶', 'Crop PDF', 'Trim the margins of pages.'),
  S('protect', 'security', '🔒︎', 'Protect PDF', 'Protect a PDF with a password.'),
  S('unlock', 'security', '🔓︎', 'Unlock PDF', 'Remove the password from a PDF.'),
  S('sign', 'security', '✍', 'Sign PDF', 'Sign a PDF.'),
  S('redact', 'security', '▮', 'Redact PDF', 'Permanently remove sensitive information.'),
  S('translate', 'ai', '⇄', 'Translate PDF', 'Translate a PDF.')
]
