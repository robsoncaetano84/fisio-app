# Etapa 38 - Imagens de exercícios via Supabase Storage

## Decisão

As imagens oficiais de exercícios devem ficar no Supabase Storage. O app baixa sob demanda apenas a imagem vista ou prescrita e mantém cache local no aparelho.

Isso evita aumentar o pacote instalado no celular a cada expansão do catálogo.

## Bucket

- bucket sugerido: `exercise-images`
- acesso recomendado para imagens aprovadas: público com URLs estáveis, ou privado com URL assinada gerada pelo backend
- estrutura:
  - `exercises/<slug>/thumb.jpg`
  - `exercises/<slug>/full.jpg`

## Banco

`exercicio_midias` guarda a mídia principal:

- `asset_key`: chave clínica usada pelo catálogo
- `storage_path`: caminho do arquivo full no bucket
- `thumbnail_url`: imagem leve para listas/cards
- `image_url`: imagem full para tela detalhada
- `mime_type`, `width`, `height`, `bytes`: metadados para auditoria e controle de peso
- `revisao_clinica_status`: volta para `PENDENTE` quando a imagem remota muda

Endpoint administrativo:

`PATCH /exercicios/{id}/midia-principal-storage`

Payload esperado:

```json
{
  "storagePath": "exercises/ponte-curta/full.jpg",
  "thumbnailUrl": "https://<project>.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/thumb.jpg",
  "imageUrl": "https://<project>.supabase.co/storage/v1/object/public/exercise-images/exercises/ponte-curta/full.jpg",
  "mimeType": "image/jpeg",
  "width": 1024,
  "height": 1024,
  "bytes": 42000
}
```

## Mobile

`ExerciseVisual` prioriza `thumbnailUrl`/`imageUrl`. Em Android/iOS, a imagem é baixada em `FileSystem.cacheDirectory/synap-exercise-images/` e reutilizada enquanto o sistema mantiver o cache.

Fallbacks:

1. URL remota cacheada.
2. Asset local já embarcado no app, enquanto a migração acontece.
3. Ilustração vetorial genérica.

## Fluxo oficial para novas imagens

1. Gerar a imagem no padrão Synap.
2. Revisar clinicamente.
3. Otimizar `thumb.jpg` e `full.jpg`.
4. Publicar no bucket `exercise-images`.
5. Registrar URLs/metadados pelo endpoint administrativo.
6. Aprovar clinicamente a mídia no catálogo.
7. Prescrever o exercício; a atividade recebe `imagemUrl` e o paciente baixa sob demanda.
