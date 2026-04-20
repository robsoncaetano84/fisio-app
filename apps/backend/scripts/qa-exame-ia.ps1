param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Email = "igorcordeiro1712@gmail.com",
  [string]$Senha = "Teste1234"
)

$ErrorActionPreference = "Stop"

function Invoke-ApiJson {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body,
    [hashtable]$Headers
  )
  $json = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 20 } else { $null }
  if ($json) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -ContentType "application/json" -Body $json
  }
  return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
}

Write-Host "[QA] Login..."
$login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Body (@{ email = $Email; senha = $Senha } | ConvertTo-Json)
if (-not $login.token) { throw "Token não retornado no login" }
$headers = @{ Authorization = "Bearer $($login.token)" }

$nowSuffix = (Get-Date).ToString("yyyyMMddHHmmss")
$cpf = -join ((1..11) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })
$nomePaciente = "QA Exame IA $nowSuffix"

Write-Host "[QA] Criando paciente..."
$paciente = Invoke-ApiJson -Method Post -Uri "$BaseUrl/pacientes" -Headers $headers -Body @{
  nomeCompleto = $nomePaciente
  cpf = $cpf
  rg = "RG$nowSuffix"
  dataNascimento = "1988-04-10"
  sexo = "FEMININO"
  estadoCivil = "SOLTEIRO"
  profissao = "Tester"
  contatoWhatsapp = "11999990000"
  contatoTelefone = "1133330000"
  contatoEmail = "qa+$nowSuffix@teste.com"
  enderecoCep = "01001000"
  enderecoRua = "Rua QA"
  enderecoNumero = "100"
  enderecoComplemento = "Sala QA"
  enderecoBairro = "Centro"
  enderecoCidade = "Sao Paulo"
  enderecoUf = "SP"
}
$pacienteId = $paciente.id
if (-not $pacienteId) { throw "Paciente sem id" }
Write-Host "[QA] Paciente criado: $pacienteId"

Write-Host "[QA] Criando anamnese..."
$anamnese = Invoke-ApiJson -Method Post -Uri "$BaseUrl/anamneses" -Headers $headers -Body @{
  pacienteId = $pacienteId
  motivoBusca = "SINTOMA_EXISTENTE"
  areasAfetadas = @(@{ regiao = "joelho"; lado = "direito" })
  intensidadeDor = 7
  descricaoSintomas = "Dor ao subir escada"
  tempoProblema = "3 meses"
  horaIntensifica = "fim do dia"
  inicioProblema = "GRADUAL"
  eventoEspecifico = ""
  fatorAlivio = "repouso"
  problemaAnterior = $false
  quandoProblemaAnterior = ""
  tratamentosAnteriores = @("Nenhum")
  historicoFamiliar = "sem historico"
}
if (-not $anamnese.id) { throw "Anamnese não criada" }

Write-Host "[QA] Criando evolução..."
$evolucao = Invoke-ApiJson -Method Post -Uri "$BaseUrl/evolucoes" -Headers $headers -Body @{
  pacienteId = $pacienteId
  data = (Get-Date).ToString("o")
  listagens = "Sem piora"
  legCheck = "ok"
  ajustes = "mobilidade"
  orientacoes = "exercicios leves"
  observacoes = "boa adesao"
}
if (-not $evolucao.id) { throw "Evolução não criada" }

$qaDir = Join-Path $PSScriptRoot "..\tmp-qa"
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null
$imagePath = Join-Path $qaDir "qa-image-$nowSuffix.png"
$pdfPath = Join-Path $qaDir "qa-file-$nowSuffix.pdf"

# PNG mínimo válido (1x1)
[byte[]]$pngBytes = 0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,0x00,0x03,0x01,0x01,0x00,0x18,0xDD,0x8D,0x18,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82
[System.IO.File]::WriteAllBytes($imagePath, $pngBytes)

# PDF mínimo simples
$pdfContent = "%PDF-1.4`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj`n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj`n4 0 obj<</Length 54>>stream`nBT /F1 12 Tf 20 100 Td (QA PDF Exame) Tj ET`nendstream endobj`n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`nxref`n0 6`n0000000000 65535 f `n0000000010 00000 n `n0000000060 00000 n `n0000000117 00000 n `n0000000243 00000 n `n0000000348 00000 n `ntrailer<</Size 6/Root 1 0 R>>`nstartxref`n420`n%%EOF"
Set-Content -Path $pdfPath -Value $pdfContent -Encoding ascii

Write-Host "[QA] Upload imagem..."
$uploadImage = curl.exe -sS -X POST "$BaseUrl/pacientes/$pacienteId/exames" `
  -H "Authorization: Bearer $($login.token)" `
  -F "file=@$imagePath;type=image/png" `
  -F "tipoExame=Raio-X" `
  -F "observacao=Imagem QA" `
  -F "dataExame=2026-04-19"
$uploadImageObj = $uploadImage | ConvertFrom-Json
if (-not $uploadImageObj.id) { throw "Falha upload imagem: $uploadImage" }

Write-Host "[QA] Upload PDF..."
$uploadPdf = curl.exe -sS -X POST "$BaseUrl/pacientes/$pacienteId/exames" `
  -H "Authorization: Bearer $($login.token)" `
  -F "file=@$pdfPath;type=application/pdf" `
  -F "tipoExame=Ressonancia" `
  -F "observacao=PDF QA" `
  -F "dataExame=2026-04-18"
$uploadPdfObj = $uploadPdf | ConvertFrom-Json
if (-not $uploadPdfObj.id) { throw "Falha upload pdf: $uploadPdf" }

Write-Host "[QA] Gerando sugestão IA de laudo..."
$sugestao = Invoke-ApiJson -Method Post -Uri "$BaseUrl/laudos/sugestao-ia" -Headers $headers -Body @{ pacienteId = $pacienteId }

$result = [PSCustomObject]@{
  pacienteId = $pacienteId
  uploadImagemId = $uploadImageObj.id
  uploadPdfId = $uploadPdfObj.id
  examesConsiderados = $sugestao.examesConsiderados
  examesComLeituraIa = $sugestao.examesComLeituraIa
  source = $sugestao.source
  hasDiagnostico = [bool]$sugestao.diagnosticoFuncional
}

Write-Host "[QA] Resultado resumo:"
$result | ConvertTo-Json -Depth 5

if (($result.examesConsiderados -as [int]) -lt 2) {
  throw "QA FAIL: examesConsiderados < 2"
}

Write-Host "[QA] PASS: fluxo exame IA (imagem + pdf) validado."
