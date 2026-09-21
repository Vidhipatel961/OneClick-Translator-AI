
const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let originalCode = code;
      
      // Basic replace
      code = code.replace(/text-white/g, 'text-text-main');
      
      // Fix primary backgrounds text colors to be explicitly dark
      // Match things like 'bg-primary ... text-text-main' or 'text-text-main ... bg-primary'
      // It's easier to just do simple string replacements for the known patterns
      code = code.replace(/bg-primary text-text-main/g, 'bg-primary text-[#04110F]');
      code = code.replace(/text-text-main bg-primary/g, 'text-[#04110F] bg-primary');
      code = code.replace(/bg-primary hover:bg-primary-dark text-text-main/g, 'bg-primary hover:bg-primary-dark text-[#04110F]');
      code = code.replace(/bg-primary hover:bg-primary-dark disabled:opacity-50 text-text-main/g, 'bg-primary hover:bg-primary-dark disabled:opacity-50 text-[#04110F]');
      code = code.replace(/bg-primary\/5 border border-primary\/20 text-text-main/g, 'bg-primary/5 border border-primary/20 text-text-main'); // this one should stay text-main since background is 5% opacity
      code = code.replace(/bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary text-text-main/g, 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary text-[#04110F]');

      code = code.replace(/text-text-main flex items-center justify-center gap-2 px-4 py-2 bg-primary/g, 'text-[#04110F] flex items-center justify-center gap-2 px-4 py-2 bg-primary');
      
      // For Translator.tsx primary button patterns:
      code = code.replace(/gap-2 text-text-main bg-primary/g, 'gap-2 text-[#04110F] bg-primary');
      code = code.replace(/flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary rounded-xl text-sm font-medium transition shadow-lg shadow-primary\/20/g, 'flex items-center gap-2 px-4 py-2 bg-primary text-[#04110F] hover:bg-primary rounded-xl text-sm font-medium transition shadow-lg shadow-primary/20');
      
      if (code !== originalCode) {
        fs.writeFileSync(fullPath, code);
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDir('frontend/src');

