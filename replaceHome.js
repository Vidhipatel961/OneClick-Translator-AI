const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Home.tsx', 'utf8');

if (!code.includes('AnimatedCounter')) {
  code = code.replace(/import \{ Link \} from 'react-router-dom';/, "import { Link } from 'react-router-dom';\nimport { AnimatedCounter } from '../components/ui/AnimatedCounter';");
}

code = code.replace(/>\$0<span/g, '>$<AnimatedCounter value={0} /><span');
code = code.replace(/>\$49<span/g, '>$<AnimatedCounter value={49} /><span');

code = code.replace(/ 10,000 text words\/mo/g, ' <AnimatedCounter value={10000} /> text words/mo');
code = code.replace(/ 10 mins video\/audio/g, ' <AnimatedCounter value={10} /> mins video/audio');
code = code.replace(/ 5 document translations/g, ' <AnimatedCounter value={5} /> document translations');
code = code.replace(/ 250,000 text words\/mo/g, ' <AnimatedCounter value={250000} /> text words/mo');
code = code.replace(/ 300 mins video\/audio/g, ' <AnimatedCounter value={300} /> mins video/audio');

fs.writeFileSync('frontend/src/pages/Home.tsx', code);
