import { randomBytes } from 'node:crypto';

const secretKeys = ['JWT_SECRET', 'REFRESH_SECRET', 'INVITE_SECRET'];

console.log('# Cole estes valores no Environment do servico backend no Render.');
console.log('# Nao comite estes valores em arquivos .env.');

for (const key of secretKeys) {
  console.log(`${key}=${randomBytes(48).toString('base64url')}`);
}
