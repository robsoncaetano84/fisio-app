# Exercise image assets

Ilustracoes proprias do Synap para exercicios prescritos.

A partir da etapa 38, novas imagens oficiais devem ser publicadas no Supabase
Storage e baixadas sob demanda pelo app. Esta pasta fica como fallback local
para os assets ja embarcados enquanto a migracao acontece.

Estado atual:

- 18 assets iniciais do catalogo base;
- 70 assets de expansao em preview, integrados como rascunho e pendentes de revisao clinica;
- 88 JPGs especificos mapeados em `ExerciseVisual`.

Padrao usado:

- base visual: matriz anatomica masculina posterior do projeto;
- estilo: anatomia em escala de cinza, fundo clinico claro e destaque verde Synap;
- dimensao: imagem quadrada entre 1000px e 1600px por lado;
- sem texto, sem logo e sem marca de terceiros dentro do arquivo;
- sem texto e sem marca d'agua;
- nomes de arquivo alinhados ao slug do exercicio no catalogo.

Ao adicionar um novo exercicio com imagem propria:

1. gerar a ilustracao no mesmo padrao visual;
2. exportar `thumb.jpg` e `full.jpg` otimizados;
3. publicar no bucket `exercise-images`;
4. registrar URLs e metadados via backend;
5. manter fallback SVG para tipos genericos ou imagens ainda nao geradas;
6. validar a imagem com profissional antes de aprovar o exercicio para prescricao.
