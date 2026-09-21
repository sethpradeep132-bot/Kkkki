const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

// replace overscroll-behavior-y: contain; with overscroll-behavior: none;
css = css.replace(/overscroll-behavior-y: contain;/g, 'overscroll-behavior: none;');

// Add overscroll-none to html, body
if (!css.includes('overscroll-behavior: none;') && css.includes('html, body {')) {
  css = css.replace('html, body {', 'html, body {\n  overscroll-behavior: none;');
}

fs.writeFileSync('src/index.css', css);
console.log('Fixed overscroll');
