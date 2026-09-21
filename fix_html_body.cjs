const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace('html, body {', 'html, body {\n  overscroll-behavior: none;');

fs.writeFileSync('src/index.css', css);
console.log('Fixed html body');
