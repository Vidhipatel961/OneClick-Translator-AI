
const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const themeProviderCode = \
function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const themeMode = localStorage.getItem('themeMode') || 'dark';
    const themeColor = localStorage.getItem('themeColor') || '#00F0FF';
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.style.setProperty('--primary', themeColor);
    document.documentElement.style.setProperty('--primary-dark', themeColor);
  }, []);
  return <>{children}</>;
}
\;

code = code.replace('export default function App() {', themeProviderCode + '\nexport default function App() {\n');
code = code.replace('<AuthProvider>', '<ThemeProvider>\n    <AuthProvider>');
code = code.replace('</AuthProvider>', '</AuthProvider>\n    </ThemeProvider>');
code = code.replace('
          <Route', '          <Route'); // fix artifact

fs.writeFileSync('frontend/src/App.tsx', code);

