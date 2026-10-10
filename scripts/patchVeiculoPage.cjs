const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../classificados-carros/app/veiculo/[slug]/page.tsx');
let code = fs.readFileSync(targetPath, 'utf8');

code = code.replace(
  '<PropostaForm titulo={v.titulo} loja={loja?.nome ?? "loja"} />',
  '<PropostaForm titulo={v.titulo} loja={loja?.nome ?? "loja"} veiculoId={v.id} lojaId={loja?.id} />'
);

fs.writeFileSync(targetPath, code, 'utf8');
console.log('page.tsx updated with veiculoId and lojaId');
