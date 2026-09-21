const fs = require('fs');

function updateAuthPage(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Find the start of the glass card
  const startMarker = '{/* Glass Card */}';
  const startIndex = code.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error('Could not find Glass Card in', file);
    return;
  }

  // Find the end of the corner accents (before <div className="relative z-10 flex flex-col gap-6">)
  const contentMarker = '<div className="relative z-10 flex flex-col gap-6">';
  const contentIndex = code.indexOf(contentMarker);

  if (contentIndex === -1) {
    console.error('Could not find form content start in', file);
    return;
  }

  const replacementHeader = `{/* Main Sci-fi Container */}
        <div className="relative w-full max-w-[550px]">
          
          {/* Top-Left Floating Triangle */}
          <div 
            className="absolute top-0 left-0 w-8 h-8 bg-white/5 border-t border-l border-white/30 backdrop-blur-md z-20"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          ></div>
          
          {/* Bottom-Right Floating Triangle */}
          <div 
            className="absolute bottom-0 right-0 w-8 h-8 bg-white/5 border-b border-r border-white/30 backdrop-blur-md z-20"
            style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}
          ></div>

          {/* Sci-fi Clipped Border Layer */}
          <div 
            className="relative w-full p-[1px] shadow-2xl bg-gradient-to-br from-white/30 via-white/5 to-white/30"
            style={{ clipPath: 'polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%, 0 40px)' }}
          >
            {/* Inner Card Background */}
            <div className="relative w-full h-full bg-[#0A0A0A]/95 backdrop-blur-xl p-8 sm:p-12">
              <div className="relative z-10 flex flex-col gap-6">`;

  const currentBeforeContent = code.slice(startIndex, contentIndex + contentMarker.length);
  code = code.replace(currentBeforeContent, replacementHeader);

  // Add the extra closing div
  code = code.replace(/        <\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/, '        </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    );\n}');

  fs.writeFileSync(file, code);
  console.log('Updated', file);
}

updateAuthPage('frontend/src/pages/Login.tsx');
updateAuthPage('frontend/src/pages/Register.tsx');
