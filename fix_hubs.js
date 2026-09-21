import fs from 'fs';

let content = fs.readFileSync('src/components/portals/CreateUserIdPage.tsx', 'utf8');

// Replace fetchHubs array mapping
content = content.replace(
  `const names = Array.from(new Set(data.map((d: any) => d.hub_name).filter(Boolean))) as string[];`,
  `const names = Array.from(new Set(data.map((d: any) => d.hub_name ? d.hub_name.replace(/\\s+/g, '_') : '').filter(Boolean))) as string[];`
);

// Replace input onChange
content = content.replace(
  `onChange={(e) => setHubManagerData({ ...hubManagerData, hubName: e.target.value })}`,
  `onChange={(e) => setHubManagerData({ ...hubManagerData, hubName: e.target.value.replace(/\\s+/g, '_') })}`
);

fs.writeFileSync('src/components/portals/CreateUserIdPage.tsx', content);
