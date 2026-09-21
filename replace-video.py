import re

file_path = r'd:\vidhi\Projects\New folder\frontend\src\pages\Home.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the video tag with an iframe
video_pattern = r'<video[\s\S]*?<\/video>'
iframe_html = '''<iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/Q8J9y9N3aZ4?autoplay=1&mute=1" 
                title="AI Translation Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>'''

code = re.sub(video_pattern, iframe_html, code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Video replaced with YouTube AI demo!")
