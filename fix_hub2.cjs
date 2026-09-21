const fs = require('fs');

let code = fs.readFileSync('src/components/portals/HubShipmentsView.tsx', 'utf-8');
code = code.replace(
  /'order status': currentCoStatus \+ \(currentCoStatus \? ' \|\| ' : ''\) \+ orderUpdateLine,/g,
  `'order status': currentCoStatus + (currentCoStatus ? ' || ' : '') + orderUpdateLine,\n               'process type': 'order updated',`
);
fs.writeFileSync('src/components/portals/HubShipmentsView.tsx', code);
console.log('Fixed HubShipmentsView.tsx');

