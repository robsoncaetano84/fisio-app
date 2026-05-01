# Roadmap IA Clinica, Fotos e Mapa Corporal

## Estado atual

- O backend ja usa a OpenAI Responses API para ler imagens/PDFs anexados como exames e gerar contexto para laudos.
- O backend agora tem fluxo proprio de fotos clinicas (`clinical_photos`) e comparacoes antes/depois (`clinical_photo_comparisons`).
- O app registra foto clinica por camera/galeria no exame fisico e na evolucao, com analise visual por IA quando configurada.
- O componente `BodyMap` foi substituido por um mapa corporal SVG frente/costas com destaque por lado e intensidade.
- A governanca de IA registra sugestoes de analise visual e comparacao visual para medir concordancia antes de pensar em treinamento.
- A anamnese agora possui `fenotipoDorEvidencias` para perguntas explicitas de dor nociceptiva, neuropatica e nociplastica.

## Principio para o agente aprender

O agente deve aprender primeiro por base de conhecimento, dados estruturados e feedback do profissional, nao por treinamento direto em dados sensiveis.

Camadas propostas:

1. Base clinica versionada
   - Protocolos, perguntas-chave, criterios de fenotipo de dor, red flags, yellow flags, testes por regiao, condutas e criterios de progressao.
   - Cada sugestao deve declarar evidencias usadas e lacunas.

2. Dados estruturados do caso
   - Anamnese com fenotipo de dor, trajetos de irradiacao, sono, estresse, fadiga, dor noturna/repouso e sinais neurologicos descritos.
   - Exame fisico V2 com ADM por articulacao/regiao, testes regionais, fotos clinicas e raciocinio final.
   - Evolucao com SOAP, dor, funcao, adesao, resposta a conduta e comparacao visual quando houver foto.

3. Feedback supervisionado
   - Registrar sugestao gerada, sugestao aplicada, sugestao rejeitada, motivo da edicao e versao do protocolo.
   - Criar painel de concordancia por tipo de sugestao: classificacao de dor, exame fisico, evolucao, laudo e plano.

4. Evals antes de lancar
   - Montar cenarios fixos anonimizados para joelho, lombar neural, ombro, cervical, quadril/coxo-femoral e dor nociplastica.
   - Cada release deve rodar os cenarios e comparar: classificacao esperada, evidencias citadas, red flags, conduta e limites.

## Fenotipo de dor

Adicionar uma secao explicita na anamnese: `Fenotipo da dor`.

Campos implementados em `fenotipoDorEvidencias`:

- `dorLocalizada`: boolean
- `pioraMovimentoEsforco`: boolean
- `melhoraRepouso`: boolean
- `inicioAposEsforcoLesao`: boolean
- `dorReproduzidaPalpacao`: boolean
- `irradiacaoTrajeto`: boolean
- `choqueFormigamentoQueimacao`: boolean
- `dormenciaAlteracaoToque`: boolean
- `pioraPosicaoNeural`: boolean
- `dorMultirregionalMigratoria`: boolean
- `dorDesproporcionalPersistente`: boolean
- `sonoRuimNaoReparador`: boolean
- `cansacoFrequente`: boolean
- `estresseElevado`: boolean
- `examesNormaisDorPersistente`: boolean

Regra inicial:

- Nociceptiva: maioria dos itens mecanicos positivos.
- Neuropatica: irradiacao/trajeto neural + choque/queimacao/formigamento/dormencia ou piora por posicao.
- Nociplastica: multirregional/desproporcional/persistente + sono/fadiga/estresse/exames normais.
- Mista: empate ou combinacao relevante entre grupos.

## Foto de postura e simetria com IA

Criar um fluxo proprio para foto clinica, separado de exame generico.

Tipos:

- `FOTO_POSTURAL_FRONTAL`
- `FOTO_POSTURAL_LATERAL_DIREITA`
- `FOTO_POSTURAL_LATERAL_ESQUERDA`
- `FOTO_POSTURAL_POSTERIOR`
- `FOTO_MOVIMENTO_ADM`

Metadados minimos:

- posicao da foto
- regiao principal
- lado
- distancia/camera padrao quando informado
- data
- consentimento de uso para IA
- observacao do profissional

Resposta esperada da IA:

- alinhamentos observaveis
- assimetrias provaveis
- qualidade da imagem
- limitacoes da analise
- achados que precisam ser confirmados manualmente
- sugestoes de campos do exame fisico a preencher

Regra de seguranca:

- A IA nao deve diagnosticar por foto.
- A IA deve descrever observacoes visuais e sugerir correlacao clinica.
- Toda saida precisa de confirmacao do profissional.

## Evolucao por foto antes/depois

Criar pares comparativos:

- `baselinePhotoId`
- `followupPhotoId`
- mesma vista/posicao
- mesma regiao
- datas
- resumo comparativo IA
- confirmacao/edicao profissional

Resposta esperada:

- diferencas visuais relevantes
- melhora/piora/sem mudanca aparente
- comparacao de simetria/alinhamento
- limitacoes por angulo, roupa, iluminacao ou enquadramento
- recomendacao de repetir foto se a comparacao for fraca

Na evolucao SOAP:

- Objetivo: incluir resumo visual confirmado.
- Avaliacao: correlacionar foto com dor, funcao e exame.
- Plano: ajustar conduta somente quando houver coerencia clinica.

## Corpo humano para selecao de area

E possivel e recomendavel substituir a grade atual por um mapa corporal visual.

Referencia de experiencia:

- Exibir corpo humano em vista anterior e posterior.
- O profissional toca na regiao dolorida.
- A regiao selecionada fica destacada em vermelho, como um mapa de dor.
- Permitir selecionar lado direito, esquerdo ou ambos.
- Permitir intensidade visual por cor:
  - vermelho claro: dor leve
  - vermelho medio: dor moderada
  - vermelho forte: dor intensa
- Permitir multiplas regioes no mesmo paciente.
- Permitir trajeto irradiado origem -> destino, por exemplo ombro direito -> braco -> punho/mao.

Opcoes:

1. Curto prazo
   - Criar componente proprio com silhueta front/back em SVG.
   - Regioes clicaveis por `Pressable`/paths: cabeca, cervical, toracica, lombar, ombro, braco, cotovelo, punho/mao, coxofemoral, joelho, tornozelo/pe.
   - Selecionar frente/costas e lado esquerdo/direito/ambos.
   - Substituir o `BodyMap` atual, que hoje e uma grade de botoes, por uma silhueta anatômica interativa.
   - Manter uma lista/resumo das regioes selecionadas abaixo do corpo para revisao rapida.

2. Medio prazo
   - Adicionar mapa com camadas: pele/superficial, articular, neural e cadeia cinetica.
   - Permitir trajetos de irradiacao desenhados como origem -> destino.
   - Permitir comparacao entre mapa inicial e mapa atual na evolucao.
   - Usar o mapa para sugerir regioes relacionadas no exame fisico.

3. Requisito tecnico
   - Adicionar `react-native-svg` se ainda nao estiver instalado.
   - Manter fallback em lista para acessibilidade e telas pequenas.
   - Usar uma silhueta propria/licenciada ou criada para o app; nao usar imagem aleatoria da internet por risco de licenca.
   - Separar visual do dado clinico: o SVG e a interface apenas representam o dado estruturado.

Modelo de dado sugerido:

```ts
type DorMapaCorporal = {
  regiao: string;
  lado: "direito" | "esquerdo" | "ambos";
  vista: "anterior" | "posterior";
  intensidade: number;
  ponto?: { x: number; y: number };
  irradiacaoPara?: string[];
};
```

Uso clinico:

- Alimentar `areasAfetadas` da anamnese.
- Alimentar sugestao de trajetos de dor irradiada.
- Alimentar foco do exame fisico e ADM por regiao.
- Comparar mapa de dor inicial vs. mapa de dor na evolucao.
- Ajudar o Charles a inferir cadeia provavel, regiao primaria e regioes relacionadas.

## Ordem recomendada de implementacao

1. Criar tabela/metadados de foto clinica e endpoint de analise IA visual.
2. Adicionar camera/galeria no mobile para fotos clinicas padronizadas.
3. Criar mapa corporal anatomico SVG, com frente/costas, destaque de dor por intensidade, lado e resumo estruturado.
4. Adicionar comparacao antes/depois em evolucao.
5. Expandir anamnese com perguntas explicitas de fenotipo de dor.
6. Criar evals clinicos e painel de concordancia da IA.

## Implementado nesta etapa

- `clinical_photos`: metadados, arquivo, tipo, vista, regiao, lado, intensidade, analise IA e limites.
- `clinical_photo_comparisons`: baseline/follow-up, resumo visual, comparacao IA e limites.
- Endpoints:
  - `GET /pacientes/:id/fotos-clinicas`
  - `POST /pacientes/:id/fotos-clinicas`
  - `POST /pacientes/:id/fotos-clinicas/:fotoId/analisar`
  - `POST /pacientes/:id/fotos-clinicas/comparar`
  - `GET /pacientes/:id/fotos-clinicas/:fotoId/arquivo`
- Mobile:
  - captura por camera/galeria no exame fisico;
  - captura e comparacao antes/depois na evolucao;
  - mapa corporal SVG frente/costas;
  - perguntas explicitas de fenotipo de dor na anamnese.
- Evals:
  - teste automatizado para uso de `fenotipoDorEvidencias` na classificacao de dor do Charles.
