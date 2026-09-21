const fs = require('fs');

function updateAuthPage(file) {
  let code = fs.readFileSync(file, 'utf8');

  // 1. Container height
  code = code.replace(/h-\[550px\]/g, 'min-h-[600px] md:min-h-[550px] md:h-[550px]');

  // 2. Hide branding overlays on mobile
  code = code.replace(/absolute top-0 right-0 w-1\/2 h-full p-12 flex flex-col/g, 'hidden md:flex absolute top-0 right-0 w-1/2 h-full p-12 flex-col');
  code = code.replace(/absolute top-0 left-0 w-1\/2 h-full p-12 flex flex-col/g, 'hidden md:flex absolute top-0 left-0 w-1/2 h-full p-12 flex-col');

  // 3. Form wrappers need full width on mobile, and hidden if inactive
  code = code.replace(/className="auth-form-wrapper login w-1\/2 px-12"/g, 'className={`auth-form-wrapper login w-full md:w-1/2 px-6 md:px-12 ${isRegister ? \'hidden md:flex\' : \'flex\'}`}');
  code = code.replace(/className="auth-form-wrapper register w-1\/2 px-12"/g, 'className={`auth-form-wrapper register w-full md:w-1/2 px-6 md:px-12 ${!isRegister ? \'hidden md:flex\' : \'flex\'}`}');

  fs.writeFileSync(file, code);
  console.log('Updated', file);
}

updateAuthPage('frontend/src/pages/Login.tsx');
updateAuthPage('frontend/src/pages/Register.tsx');
