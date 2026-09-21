const fs = require('fs');
['src/components/portals/RoleChatModal.tsx', 'src/components/portals/AnnouncementChatModal.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('document.body.style.overflow = "hidden";')) {
    code = code.replace('  if (!isOpen) return null;', '  React.useEffect(() => {\n    if (isOpen) {\n      document.body.style.overflow = "hidden";\n      return () => { document.body.style.overflow = "auto"; };\n    }\n    return () => { document.body.style.overflow = "auto"; };\n  }, [isOpen]);\n\n  if (!isOpen) return null;');
    fs.writeFileSync(file, code);
  }
});
