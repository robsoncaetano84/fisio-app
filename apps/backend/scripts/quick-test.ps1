param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Email = "admin@teste.com",
  [string]$Senha = "Teste1234",
  [string]$NomePaciente = "Paciente Teste",
  [string]$NomeUsuario = "Admin Teste",
  [string]$RegistroProf = "CREFITO-000000",
  [string]$Especialidade = "Fisioterapia",
  [string]$Role = "USER",
  [string]$Cpf = ""
)

$ErrorActionPreference = "Stop"

$JsonContentType = "application/json; charset=utf-8"

function ConvertTo-JsonBody {
  param(
    [Parameter(Mandatory = $true)][object]$Body,
    [int]$Depth = 20
  )

  if ($Body -is [string]) { return $Body }
  return ($Body | ConvertTo-Json -Depth $Depth -Compress)
}

function Invoke-JsonPost {
  param(
    [string]$Uri,
    [object]$Body,
    [hashtable]$Headers,
    [int]$Depth = 20
  )

  $request = @{
    Method = "Post"
    Uri = $Uri
    ContentType = $JsonContentType
    Body = (ConvertTo-JsonBody -Body $Body -Depth $Depth)
  }
  if ($null -ne $Headers -and $Headers.Count -gt 0) {
    $request.Headers = $Headers
  }

  return Invoke-RestMethod @request
}

function Invoke-JsonPatch {
  param(
    [string]$Uri,
    [object]$Body,
    [hashtable]$Headers,
    [int]$Depth = 20
  )

  $request = @{
    Method = "Patch"
    Uri = $Uri
    ContentType = $JsonContentType
    Body = (ConvertTo-JsonBody -Body $Body -Depth $Depth)
  }
  if ($null -ne $Headers -and $Headers.Count -gt 0) {
    $request.Headers = $Headers
  }

  return Invoke-RestMethod @request
}

function Invoke-JsonGet {
  param(
    [string]$Uri,
    [hashtable]$Headers
  )

  $request = @{
    Method = "Get"
    Uri = $Uri
  }
  if ($null -ne $Headers -and $Headers.Count -gt 0) {
    $request.Headers = $Headers
  }

  return Invoke-RestMethod @request
}

function Get-ErrorStatusCode {
  param([object]$ErrorRecord)

  $response = $ErrorRecord.Exception.Response
  if ($null -eq $response) { return $null }

  if ($response.StatusCode -is [int]) {
    return [int]$response.StatusCode
  }

  if ($null -ne $response.StatusCode.value__) {
    return [int]$response.StatusCode.value__
  }

  return $null
}

function Assert-JsonRequestFails {
  param(
    [ValidateSet("Get", "Post", "Patch")][string]$Method,
    [string]$Uri,
    [object]$Body,
    [hashtable]$Headers,
    [int]$ExpectedStatus,
    [string]$Label,
    [int]$Depth = 20
  )

  try {
    if ($Method -eq "Get") {
      Invoke-JsonGet -Uri $Uri -Headers $Headers | Out-Null
    } elseif ($Method -eq "Patch") {
      Invoke-JsonPatch -Uri $Uri -Headers $Headers -Body $Body -Depth $Depth | Out-Null
    } else {
      Invoke-JsonPost -Uri $Uri -Headers $Headers -Body $Body -Depth $Depth | Out-Null
    }
  } catch {
    $statusCode = Get-ErrorStatusCode $_
    if ($statusCode -eq $ExpectedStatus) {
      Write-Host "OK esperado: $Label ($ExpectedStatus)"
      return
    }
    throw "$Label retornou status inesperado. Esperado=$ExpectedStatus Recebido=$statusCode"
  }

  throw "$Label deveria falhar com status $ExpectedStatus, mas passou."
}

function New-RandomEmail {
  param([string]$BaseEmail)
  $parts = $BaseEmail.Split("@");
  if ($parts.Length -ne 2) { return $BaseEmail }
  $rand = Get-Random -Minimum 1000 -Maximum 9999
  return "{0}+{1}@{2}" -f $parts[0], $rand, $parts[1]
}

function New-RandomCpf {
  $digits = 1..11 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }
  return ($digits -join '')
}

function Try-Login {
  param([string]$Email, [string]$Senha, [string]$BaseUrl)
  $loginBody = @{ identificador = $Email; senha = $Senha }
  try {
    $login = Invoke-JsonPost -Uri "$BaseUrl/auth/login" -Body $loginBody
    return $login.token
  } catch {
    return $null
  }
}

Write-Host "Login..."
$token = Try-Login -Email $Email -Senha $Senha -BaseUrl $BaseUrl
if (-not $token) {
  Write-Host "Usuario nao encontrado ou senha invalida. Registrando usuario..."
  $attemptEmail = $Email
  try {
    $registroBody = @{
      nome = $NomeUsuario
      email = $attemptEmail
      senha = $Senha
      registroProf = $RegistroProf
      conselhoSigla = "CREFITO"
      conselhoUf = "SP"
      especialidade = $Especialidade
      role = $Role
      consentProfessionalLgpdRequired = $true
    }
    Invoke-JsonPost -Uri "$BaseUrl/auth/registro" -Body $registroBody | Out-Null
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
      $attemptEmail = New-RandomEmail $Email
      $registroBody = @{
        nome = $NomeUsuario
        email = $attemptEmail
        senha = $Senha
        registroProf = $RegistroProf
        conselhoSigla = "CREFITO"
        conselhoUf = "SP"
        especialidade = $Especialidade
        role = $Role
        consentProfessionalLgpdRequired = $true
      }
      Invoke-JsonPost -Uri "$BaseUrl/auth/registro" -Body $registroBody | Out-Null
    } else {
      throw
    }
  }

  $Email = $attemptEmail
  $token = Try-Login -Email $Email -Senha $Senha -BaseUrl $BaseUrl
  if (-not $token) {
    throw "Falha ao autenticar apos registro."
  }
}

$headers = @{ Authorization = "Bearer $token" }

Write-Host "Criando paciente..."
$cpfValue = $Cpf
if ([string]::IsNullOrWhiteSpace($cpfValue)) {
  $cpfValue = New-RandomCpf
}
$pacienteBody = @{
  nomeCompleto = $NomePaciente
  cpf = $cpfValue
  rg = "1234567"
  dataNascimento = "1990-01-01"
  sexo = "MASCULINO"
  estadoCivil = "SOLTEIRO"
  profissao = "Fisioterapeuta"
  contatoWhatsapp = "11999999999"
  contatoTelefone = "1133334444"
  contatoEmail = "paciente@teste.com"
  enderecoCep = "01001000"
  enderecoRua = "Rua Teste"
  enderecoNumero = "100"
  enderecoComplemento = "Sala 1"
  enderecoBairro = "Centro"
  enderecoCidade = "Sao Paulo"
  enderecoUf = "SP"
}

$paciente = Invoke-JsonPost -Uri "$BaseUrl/pacientes" -Headers $headers -Body $pacienteBody -Depth 6
$pacienteId = $paciente.id
if (-not $pacienteId) {
  throw "Paciente nao retornou id."
}
Write-Host "Paciente criado: $pacienteId"

Write-Host "Criando anamnese..."
$anamneseBody = @{
  pacienteId = $pacienteId
  motivoBusca = "SINTOMA_EXISTENTE"
  mecanismoLesao = "SOBRECARGA"
  areasAfetadas = @(@{ regiao = "coluna"; lado = "direito" })
  intensidadeDor = 6
  descricaoSintomas = "Dor lombar"
  tempoProblema = "2 meses"
  horaIntensifica = "noite"
  inicioProblema = "GRADUAL"
  eventoEspecifico = ""
  fatorAlivio = "repouso"
  fatoresPiora = "ficar muito tempo sentado"
  problemaAnterior = $false
  quandoProblemaAnterior = ""
  tratamentosAnteriores = @("Massagens")
}

$anamnese = Invoke-JsonPost -Uri "$BaseUrl/anamneses" -Headers $headers -Body $anamneseBody -Depth 6
$anamneseId = $anamnese.id
Write-Host "Anamnese criada: $anamneseId"

Write-Host "Criando evolucao..."
$evolucaoBody = @{
  pacienteId = $pacienteId
  data = (Get-Date).ToString("o")
  listagens = "Paciente refere melhora"
  legCheck = "sem alteracoes"
  ajustes = "Ajuste em T4-T5"
  orientacoes = "Alongamentos diarios"
  observacoes = "Evolucao positiva"
}

$evolucao = Invoke-JsonPost -Uri "$BaseUrl/evolucoes" -Headers $headers -Body $evolucaoBody -Depth 6
$evolucaoId = $evolucao.id
Write-Host "Evolucao criada: $evolucaoId"

Write-Host "Gerando convite de acesso do paciente..."
$invite = Invoke-JsonPost -Uri "$BaseUrl/auth/paciente-convite" -Headers $headers -Body @{
  pacienteId = $pacienteId
  diasExpiracao = 7
} -Depth 4
if (-not $invite.token) {
  throw "Convite nao retornou token."
}

$pacienteAppEmail = New-RandomEmail "paciente@teste.com"
$registroPaciente = Invoke-JsonPost -Uri "$BaseUrl/auth/registro-paciente-convite" -Body @{
  conviteToken = $invite.token
  nome = "$NomePaciente App"
  email = $pacienteAppEmail
  senha = $Senha
  consentTermsRequired = $true
  consentPrivacyRequired = $true
  consentResearchOptional = $false
  consentAiOptional = $true
} -Depth 6
if (-not $registroPaciente.token) {
  throw "Registro por convite nao retornou token do paciente."
}
$pacienteHeaders = @{ Authorization = "Bearer $($registroPaciente.token)" }

$myAnamneseBody = @{
  motivoBusca = "SINTOMA_EXISTENTE"
  mecanismoLesao = "SOBRECARGA"
  areasAfetadas = @(@{ regiao = "joelho"; lado = "direito" })
  intensidadeDor = 7
  descricaoSintomas = "Dor forte no joelho ha duas semanas"
  tempoProblema = "2 semanas"
  horaIntensifica = "ao subir escadas"
  inicioProblema = "GRADUAL"
  eventoEspecifico = "sem trauma direto"
  fatorAlivio = "repouso e gelo"
  fatoresPiora = "agachar e subir escadas"
  problemaAnterior = $false
  quandoProblemaAnterior = ""
  tratamentosAnteriores = @("Analgesico")
}

Assert-JsonRequestFails `
  -Method Post `
  -Uri "$BaseUrl/anamneses/me" `
  -Headers $pacienteHeaders `
  -Body $myAnamneseBody `
  -ExpectedStatus 403 `
  -Label "Anamnese do paciente antes da liberacao" `
  -Depth 6

Write-Host "Liberando anamnese para o paciente..."
Invoke-JsonPatch -Uri "$BaseUrl/pacientes/$pacienteId" -Headers $headers -Body @{
  anamneseLiberadaPaciente = $true
} -Depth 4 | Out-Null

$myAnamnese = Invoke-JsonPost -Uri "$BaseUrl/anamneses/me" -Headers $pacienteHeaders -Body $myAnamneseBody -Depth 6
if (-not $myAnamnese.id) {
  throw "Anamnese do paciente liberada nao retornou id."
}
Write-Host "Anamnese do paciente criada: $($myAnamnese.id)"

Write-Host "Criando laudo para regra de publicacao..."
$laudoBody = @{
  pacienteId = $pacienteId
  motivoAvaliacao = "Dor forte no joelho direito ha duas semanas"
  historicoClinico = "Paciente relata piora ao subir escadas e agachar, sem trauma direto."
  achadosClinicos = "Dor anterior no joelho direito, limitacao funcional em agachamento e subida de escadas."
  diagnosticoFuncional = "Sobrecarga femoropatelar provavel, dependente de confirmacao profissional."
  objetivosCurtoPrazo = "Reduzir dor e melhorar tolerancia a carga."
  objetivosMedioPrazo = "Retomar atividades diarias sem dor limitante."
  frequenciaSemanal = 2
  duracaoSemanas = 6
  conclusao = "Plano inicial conservador com progressao conforme resposta clinica."
  condutas = "Educacao, analgesia fisica, exercicios leves e progressao de fortalecimento."
  planoTratamentoIA = "Exercicios de mobilidade, fortalecimento gradual e orientacoes domiciliares."
  observacoes = "Laudo smoke de pre-producao."
  criteriosAlta = "Dor controlada e retorno funcional."
}
$laudo = Invoke-JsonPost -Uri "$BaseUrl/laudos" -Headers $headers -Body $laudoBody -Depth 6
$laudoId = $laudo.id
if (-not $laudoId) {
  throw "Laudo nao retornou id."
}

Assert-JsonRequestFails `
  -Method Get `
  -Uri "$BaseUrl/laudos/self" `
  -Headers $pacienteHeaders `
  -ExpectedStatus 404 `
  -Label "Resumo de laudo do paciente antes da publicacao"

Assert-JsonRequestFails `
  -Method Get `
  -Uri "$BaseUrl/laudos/self/pdf-laudo" `
  -Headers $pacienteHeaders `
  -ExpectedStatus 404 `
  -Label "PDF do paciente antes da publicacao"

Assert-JsonRequestFails `
  -Method Post `
  -Uri "$BaseUrl/laudos/$laudoId/publicar-paciente" `
  -Headers $headers `
  -Body @{} `
  -ExpectedStatus 400 `
  -Label "Publicacao de laudo antes da validacao"

Write-Host "Validando e publicando laudo ao paciente..."
$laudoValidado = Invoke-JsonPost -Uri "$BaseUrl/laudos/$laudoId/validar" -Headers $headers -Body @{} -Depth 4
if ($laudoValidado.status -ne "VALIDADO_PROFISSIONAL") {
  throw "Laudo validado retornou status inesperado: $($laudoValidado.status)"
}

$laudoPublicado = Invoke-JsonPost -Uri "$BaseUrl/laudos/$laudoId/publicar-paciente" -Headers $headers -Body @{} -Depth 4
if ($laudoPublicado.status -ne "PUBLICADO_PACIENTE") {
  throw "Laudo publicado retornou status inesperado: $($laudoPublicado.status)"
}

$selfLaudoDepois = Invoke-JsonGet -Uri "$BaseUrl/laudos/self" -Headers $pacienteHeaders
if ($selfLaudoDepois.id -ne $laudoId -or $selfLaudoDepois.status -ne "PUBLICADO_PACIENTE") {
  throw "Paciente nao recebeu o laudo publicado esperado."
}

$pdfResponse = Invoke-WebRequest -Method Get -Uri "$BaseUrl/laudos/self/pdf-laudo" -Headers $pacienteHeaders -UseBasicParsing
if ($pdfResponse.StatusCode -ne 200) {
  throw "PDF publicado retornou status inesperado: $($pdfResponse.StatusCode)"
}
$pdfContentType = [string]$pdfResponse.Headers["Content-Type"]
if (-not $pdfContentType.StartsWith("application/pdf")) {
  throw "PDF publicado retornou Content-Type inesperado: $pdfContentType"
}

Write-Host "Testando revogacao de convite pendente..."
$pacienteRevogarBody = $pacienteBody.Clone()
$pacienteRevogarBody.nomeCompleto = "$NomePaciente Convite Revogado"
$pacienteRevogarBody.cpf = New-RandomCpf
$pacienteRevogarBody.contatoEmail = New-RandomEmail "paciente@teste.com"
$pacienteRevogar = Invoke-JsonPost -Uri "$BaseUrl/pacientes" -Headers $headers -Body $pacienteRevogarBody -Depth 6
$conviteRevogar = Invoke-JsonPost -Uri "$BaseUrl/auth/paciente-convite" -Headers $headers -Body @{
  pacienteId = $pacienteRevogar.id
  diasExpiracao = 7
} -Depth 4
Invoke-JsonPost -Uri "$BaseUrl/pacientes/$($pacienteRevogar.id)/revogar-convite" -Headers $headers -Body @{} -Depth 4 | Out-Null
$conviteRevogarToken = [uri]::EscapeDataString($conviteRevogar.token)
Assert-JsonRequestFails `
  -Method Get `
  -Uri "$BaseUrl/auth/paciente-convite-dados?conviteToken=$conviteRevogarToken" `
  -ExpectedStatus 400 `
  -Label "Consulta de convite revogado"

Write-Host "OK: fluxo completo executado."


