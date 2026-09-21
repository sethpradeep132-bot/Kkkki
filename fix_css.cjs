const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Remove previously added html, body tags
css = css.replace(/html, body {[\s\S]*?}/g, '');
css = css.replace(/#root {\n  height: 100%;\n  width: 100%;\n}/g, '');

// Append correct ones
css += `
html, body {
  height: 100dvh;
  width: 100%;
  overflow: hidden; 
}
#root {
  height: 100%;
  width: 100%;
}
`;

fs.writeFileSync('src/index.css', css);
