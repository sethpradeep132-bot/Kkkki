const fs = require('fs');
let sql = fs.readFileSync('setup supabase .sql', 'utf8');

// Find the carts table section and remove the "product code" line
const cartsStart = sql.indexOf('CREATE TABLE carts (');
if (cartsStart !== -1) {
  const cartsEnd = sql.indexOf(');', cartsStart);
  if (cartsEnd !== -1) {
    let cartsTable = sql.substring(cartsStart, cartsEnd + 2);
    cartsTable = cartsTable.replace('  "product code" TEXT,\n', '');
    sql = sql.substring(0, cartsStart) + cartsTable + sql.substring(cartsEnd + 2);
    fs.writeFileSync('setup supabase .sql', sql);
    console.log("Fixed carts table");
  }
}
