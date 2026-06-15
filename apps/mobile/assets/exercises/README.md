# Exercise image assets

Ilustracoes proprias do Synap para exercicios prescritos.

Padrao usado:
- base visual: matriz anatomica masculina posterior do projeto;
- estilo: anatomia em escala de cinza, fundo clinico claro e destaque verde Synap;
- sem texto, sem logo e sem marca de terceiros dentro do arquivo;
- marca d'agua `Synap` aplicada pelo componente `ExerciseVisual`;
- nomes de arquivo alinhados ao slug do exercicio no catalogo.

Ao adicionar um novo exercicio com imagem propria:
1. gerar o PNG no mesmo padrao visual;
2. salvar como JPG otimizado, com nome em kebab-case equivalente ao slug;
3. mapear o asset em `ExerciseVisual`;
4. manter fallback SVG para tipos genericos ou imagens ainda nao geradas.
