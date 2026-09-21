const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

// Remove auth-container and related classes
code = code.replace(/\.auth-container \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-card-bg[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-card-bg-2[\s\S]*?\}\n/g, '');
code = code.replace(/\/\* LOGIN MODE[^}]*\}\n/g, '');
code = code.replace(/\/\* REGISTER MODE[^}]*\}\n/g, '');
code = code.replace(/@keyframes card-bg-login-anim[\s\S]*?\}\n/g, '');
code = code.replace(/@keyframes card-bg-register-anim[\s\S]*?\}\n/g, '');
code = code.replace(/@keyframes card-bg-2-login-anim[\s\S]*?\}\n/g, '');
code = code.replace(/@keyframes card-bg-2-register-anim[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-container:not\(\.is-register\)[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-container\.is-register[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-wrapper \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-wrapper\.register \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-wrapper\.login \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-content \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-wrapper\.register \.auth-form-content \{[\s\S]*?\}\n/g, '');
code = code.replace(/\.auth-form-wrapper\.login \.auth-form-content \{[\s\S]*?\}\n/g, '');
code = code.replace(/@media \(max-width: 768px\) \{[\s\S]*\}\s*\}/g, '');

fs.writeFileSync('frontend/src/index.css', code);
console.log('Cleaned up legacy auth CSS');
