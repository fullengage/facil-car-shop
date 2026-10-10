const fs = require('fs');
const path = require('path');

// 1. Atualizar app/layout.tsx
const layoutPath = path.resolve(__dirname, '../../classificados-carros/app/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

layoutContent = layoutContent.replace(
  'import { Yantramanav } from "next/font/google";',
  'import { Poppins } from "next/font/google";'
);

layoutContent = layoutContent.replace(
  `const yantramanav = Yantramanav({
  variable: "--font-yantramanav",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});`,
  `const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});`
);

layoutContent = layoutContent.replace(
  '${yantramanav.variable}',
  '${poppins.variable}'
);

fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('layout.tsx updated with Poppins font');

// 2. Atualizar app/globals.css
const cssPath = path.resolve(__dirname, '../../classificados-carros/app/globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

cssContent = cssContent.replace(
  '--font-sans: var(--font-yantramanav), system-ui, sans-serif;',
  '--font-sans: var(--font-poppins), "Poppins", system-ui, -apple-system, sans-serif;'
);

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('globals.css updated with Poppins font');
