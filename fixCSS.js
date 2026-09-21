const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

const mediaQuery = `
@media (max-width: 768px) {
  .auth-card-bg {
    display: none !important;
  }
  .auth-container {
    height: auto !important;
    min-height: 600px;
    display: flex !important;
    flex-direction: column !important;
  }
  .auth-form-wrapper {
    width: 100% !important;
    position: relative !important;
  }
  .auth-form-wrapper.register {
    right: auto !important;
  }
  .auth-form-wrapper.login {
    left: auto !important;
  }
  .auth-form-content {
    translate: 0 !important;
    opacity: 1 !important;
    transition: none !important;
    pointer-events: auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .auth-container:not(.is-register) .auth-form-wrapper.login .auth-form-content,
  .auth-container.is-register .auth-form-wrapper.register .auth-form-content {
    transition: none !important;
  }
}
`;

code = code.replace(/@media \(max-width: 768px\) \{[\s\S]*\}\s*\}/, '');

fs.writeFileSync('frontend/src/index.css', code.trim() + '\n\n' + mediaQuery);
console.log('Fixed CSS again');
