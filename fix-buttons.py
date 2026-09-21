import re

file_path = r'd:\vidhi\Projects\New folder\frontend\src\pages\AuthPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# The broken syntax is: className="w-full mt-4 text-background font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-70 transition-all hover:scale-[1.02] active:scale-[0.98]" className="bg-primary text-background"
# We want to merge them into one className.
# We can use regex to find className="..." className="..."
pattern = r'className="([^"]+)" className="bg-primary text-background"'
replacement = r'className="\1 bg-primary"'

code = re.sub(pattern, replacement, code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Buttons fixed!")
