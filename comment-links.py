import re

file_path = r'd:\vidhi\Projects\New folder\frontend\src\pages\Home.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Desktop links
code = code.replace('<a href="#how-it-works" className="text-text-muted hover:text-text-main transition-colors">How it Works</a>', '{/* <a href="#how-it-works" className="text-text-muted hover:text-text-main transition-colors">How it Works</a> */}')
code = code.replace('<a href="#pricing" className="text-text-muted hover:text-text-main transition-colors">Pricing</a>', '{/* <a href="#pricing" className="text-text-muted hover:text-text-main transition-colors">Pricing</a> */}')
code = code.replace('<a href="#faq" className="text-text-muted hover:text-text-main transition-colors">FAQ</a>', '{/* <a href="#faq" className="text-text-muted hover:text-text-main transition-colors">FAQ</a> */}')

# Mobile links (FAQ may or may not be there)
code = code.replace('<a href="#how-it-works" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">How it Works</a>', '{/* <a href="#how-it-works" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">How it Works</a> */}')
code = code.replace('<a href="#pricing" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">Pricing</a>', '{/* <a href="#pricing" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">Pricing</a> */}')
code = code.replace('<a href="#faq" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">FAQ</a>', '{/* <a href="#faq" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-text-main hover:bg-surface-hover rounded-lg font-medium">FAQ</a> */}')

# Check for line break versions in case Prettier formatted it
code = re.sub(r'(<a href="#how-it-works"[^>]*>How it\s*Works</a>)', r'{/* \1 */}', code)
code = re.sub(r'(<a href="#pricing"[^>]*>Pricing</a>)', r'{/* \1 */}', code)
code = re.sub(r'(<a href="#faq"[^>]*>FAQ</a>)', r'{/* \1 */}', code)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Links commented out!")
