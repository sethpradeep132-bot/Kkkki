const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
    '{ password, user_metadata }',
    '{ password, user_metadata, email_confirm: true }'
);

fs.writeFileSync('server.ts', code);
