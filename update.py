import os
import re

file_path = r'd:\vidhi\Projects\New folder\frontend\src\pages\AuthPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'const limeGreen = "#ccff00";\n\n', '', code)
code = code.replace('style={{ color: limeGreen }}', 'className="text-primary"')
code = code.replace('style={{ backgroundColor: limeGreen }}', 'className="bg-primary text-background"')

code = code.replace('bg-[#050505]', 'bg-background')
code = code.replace('bg-[#0A0A0A]', 'bg-surface')
code = code.replace('bg-[#131313]', 'bg-background')
code = code.replace('bg-[#05100B]', 'bg-surface-hover')

code = code.replace('border-white/5', 'border-border')
code = code.replace('border-white/10', 'border-border')
code = code.replace('border-white/20', 'border-primary/30')
code = code.replace('border-white/30', 'border-primary/50')

code = code.replace('text-white', 'text-text-main')
code = code.replace('text-[#888]', 'text-text-muted')
code = code.replace('text-[#999]', 'text-text-muted')
code = code.replace('text-[#555]', 'text-text-disabled')
code = code.replace('text-[#444]', 'text-text-disabled')

code = code.replace('bg-[#ccff00]', 'bg-primary')
code = code.replace('text-black', 'text-background')
code = code.replace('color: limeGreen', 'color: "var(--primary)"')
code = code.replace('backgroundColor: limeGreen', 'backgroundColor: "var(--primary)"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print('Updated AuthPage.tsx successfully!')
