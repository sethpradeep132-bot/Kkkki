const fs = require('fs');

let code = fs.readFileSync('src/components/portals/AuthLogin.tsx', 'utf8');
code = code.replace(/export const AuthLogin: React.FC<AuthLoginProps> = \({ portalName, onLoginSuccess, onBack }\) => {/,
`export const AuthLogin: React.FC<AuthLoginProps> = ({ portalName, onLoginSuccess, onBack }) => {
  console.log("AuthLogin rendered for portal:", portalName);`);
fs.writeFileSync('src/components/portals/AuthLogin.tsx', code);

code = fs.readFileSync('src/components/portals/CustomerPortal.tsx', 'utf8');
code = code.replace(/export const CustomerPortal: React.FC<PortalProps> = \({ onBack }\) => {/,
`export const CustomerPortal: React.FC<PortalProps> = ({ onBack }) => {
  console.log("CustomerPortal rendered");`);
fs.writeFileSync('src/components/portals/CustomerPortal.tsx', code);
