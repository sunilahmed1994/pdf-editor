
# Free PDF Editor Online

A free, browser-based PDF editor built with React and Vite. Edit, convert, merge, split, rotate, and manage PDF documents directly in your browser without creating an account.

🌐 **Live Website:** https://youlovepdfedit.vercel.app/

## Features

### PDF Editing
- Upload PDF files using drag and drop.
- Add and edit text.
- Insert images into PDF pages.
- Move and resize objects.
- Undo and redo changes.
- Download edited PDF files.

### PDF Management Tools
- Merge PDF files.
- Split PDF documents.
- Remove or extract pages.
- Rotate PDF pages.
- Add page numbers.
- Add watermarks.

### PDF Conversion
- PDF to PNG and JPG.
- PDF to Word.
- PDF to Excel.
- PDF to PowerPoint.
- Images to PDF.
- Word to PDF.
- Excel to PDF.
- PowerPoint to PDF.
- Export PDF text to TXT.

### Privacy & Security
- No login required.
- No account registration.
- Files remain in the user's browser.
- No server upload required for browser-based editing.

## Technology Stack

- React
- Vite
- JavaScript
- CSS

## Getting Started

Requirements: Node.js 18 or later.

```bash
git clone https://github.com/sunilahmed1994/pdf-editor.git
cd pdf-editor
npm install
npm run dev
```

Open the local URL displayed in your terminal.

## Build for Production

```bash
npm run build
```

The production files will be generated in the `dist` directory.

## Deployment

This project supports deployment through Vercel or Netlify.

- Build Command: `npm run build`
- Output Directory: `dist`

## Project Structure

- `src/App.jsx` - Main PDF editor logic.
- `src/PageView.jsx` - PDF page rendering and object interactions.
- `src/styles.css` - Application styling.
- `src/catalog.js` - PDF tools catalog.
- `src/tools.js` - Tool functions.
- `src/seo.js` - SEO metadata and tool pages.

## Current Limitations

- Urdu font embedding is not yet supported.
- Existing PDF images cannot currently be edited or deleted.
- Text replacement uses a white overlay rather than permanent PDF redaction.
- Advanced formatting and scanned PDF OCR are limited.
- Some advanced conversions require a backend.

## SEO & Search Engine Optimization

The project includes:
- Individual SEO-friendly tool pages.
- Custom page titles and descriptions.
- FAQ and JSON-LD structured data.
- Sitemap generation.
- Robots.txt generation.
- Static HTML prerendering.

## Live Demo

Try the editor online:

**[Free PDF Editor Online](https://youlovepdfedit.vercel.app/)**

## Contributing

Suggestions, bug reports, and contributions are welcome!

## License

See the repository for license information.
