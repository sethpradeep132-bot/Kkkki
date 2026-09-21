import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Add chatContainerRef
    if "chatContainerRef = useRef<HTMLDivElement>(null);" not in content:
        content = content.replace("const messagesEndRef = useRef<HTMLDivElement>(null);", 
            "const messagesEndRef = useRef<HTMLDivElement>(null);\n  const chatContainerRef = useRef<HTMLDivElement>(null);")

    # 2. Add ref to the container
    content = content.replace('<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">',
            '<div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">')

    # 3. Replace scrollIntoView
    content = content.replace("messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });",
            "if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }")

    with open(filepath, 'w') as f:
        f.write(content)

fix_file('src/components/portals/AnnouncementChatModal.tsx')
fix_file('src/components/portals/RoleChatModal.tsx')
