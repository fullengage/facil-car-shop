const fs = require('fs');
const path = require('path');

// 1. Copiar componentes de dashboard
const srcDashDir = path.resolve(__dirname, '../src/components/dashboard');
const destDashDir = path.resolve(__dirname, '../../classificados-carros/components/dashboard');

if (!fs.existsSync(destDashDir)) {
  fs.mkdirSync(destDashDir, { recursive: true });
}

fs.readdirSync(srcDashDir).forEach(file => {
  let content = fs.readFileSync(path.join(srcDashDir, file), 'utf8');
  // Ajustes de imports caso necessário
  content = content.replace(/@\/services\/crmService/g, '@/lib/crmService');
  content = content.replace(/@\/types/g, '@/lib/crmTypes');
  content = content.replace(/@\/utils\/plateValidator/g, '@/lib/formatters');
  content = content.replace(/@\/components\/ui\/button/g, '@/components/ui/Button');
  content = content.replace(/@\/components\/ui\/input/g, '@/components/ui/Input');
  fs.writeFileSync(path.join(destDashDir, file), content, 'utf8');
});

// 2. Copiar crmService.ts para classificados-carros/lib/crmService.ts
const crmServiceSrc = path.resolve(__dirname, '../src/services/crmService.ts');
let crmServiceContent = fs.readFileSync(crmServiceSrc, 'utf8');
crmServiceContent = crmServiceContent.replace(/@\/services\/supabaseClient/g, '@/lib/supabase');
crmServiceContent = crmServiceContent.replace(/@\/types/g, '@/lib/crmTypes');
crmServiceContent = crmServiceContent.replace(/@\/utils\/plateValidator/g, '@/lib/formatters');
fs.writeFileSync(path.resolve(__dirname, '../../classificados-carros/lib/crmService.ts'), crmServiceContent, 'utf8');

// 3. Copiar crm.ts para classificados-carros/lib/crmTypes.ts
const crmTypesSrc = path.resolve(__dirname, '../src/types/crm.ts');
let crmTypesContent = fs.readFileSync(crmTypesSrc, 'utf8');
crmTypesContent += `\n
export interface Vehicle {
  id: string;
  store_id: string;
  title: string;
  brand: string;
  model: string;
  version?: string;
  model_year: number;
  manufacturing_year?: number;
  fuel_type?: string;
  color?: string;
  mileage: number;
  transmission?: string;
  price: number;
  description?: string;
  photos: string[];
  status: string;
  plate_masked?: string;
  fipe_price?: number;
}

export interface Store {
  id: string;
  name: string;
  corporate_name?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address_street?: string;
  address_number?: string;
  address_city?: string;
  address_state?: string;
  slug?: string;
  status: string;
}
`;
fs.writeFileSync(path.resolve(__dirname, '../../classificados-carros/lib/crmTypes.ts'), crmTypesContent, 'utf8');

// 4. Criar lib/formatters.ts se não existir
const formattersPath = path.resolve(__dirname, '../../classificados-carros/lib/formatters.ts');
const formattersContent = `
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}
`;
fs.writeFileSync(formattersPath, formattersContent, 'utf8');

// 5. Criar components/ui/Input.tsx se não existir
const inputPath = path.resolve(__dirname, '../../classificados-carros/components/ui/Input.tsx');
const inputContent = `
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={"flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 " + className}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
`;
fs.writeFileSync(inputPath, inputContent, 'utf8');

console.log('Tudo sincronizado com sucesso para classificados-carros!');
