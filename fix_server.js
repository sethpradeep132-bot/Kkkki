const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Fix line 324
code = code.replace(
    'if (error) { console.error("GoTrue update error:", error.message); }',
    'if (error) { console.error("Database query error in get-users:", error.message); }'
);

// Fix line 375
code = code.replace(
    'if (email && email !== oldEmail) {\n            updatePayload.email = email;\n         }',
    'if (email && email !== oldEmail) {\n            updatePayload.email = email;\n            updatePayload.email_confirm = true;\n         }'
);

fs.writeFileSync('server.ts', code);
