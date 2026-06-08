param(
  [string]$BaseUrl = "http://localhost:3000/api",
  [string]$Email = "admin@teste.com",
  [string]$Senha = "Teste1234",
  [string]$NomePaciente = "Paciente Teste",
  [string]$NomeUsuario = "Admin Teste",
  [string]$RegistroProf = "CREFITO-000000",
  [string]$Especialidade = "Fisioterapia",
  [string]$Role = "USER",
  [string]$AdminEmail = "master@teste.com",
  [string]$AdminSenha = "",
  [string]$AdminNome = "Admin Master Smoke",
  [string]$AdminRegistroProf = "CREFITO-ADMIN-000000",
  [string]$Cpf = "",
  [switch]$SkipAiPreview
)

$ErrorActionPreference = "Stop"

$JsonContentType = "application/json; charset=utf-8"
Add-Type -AssemblyName System.Net.Http

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

function Invoke-MultipartPost {
  param(
    [string]$Uri,
    [string]$FilePath,
    [hashtable]$Fields,
    [hashtable]$Headers,
    [string]$FileFieldName = "file",
    [string]$ContentType = "application/pdf"
  )

  $client = New-Object System.Net.Http.HttpClient
  $content = New-Object System.Net.Http.MultipartFormDataContent
  $stream = $null
  try {
    if ($null -ne $Headers) {
      foreach ($key in $Headers.Keys) {
        $value = [string]$Headers[$key]
        if ($key -eq "Authorization") {
          $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::Parse($value)
        } else {
          [void]$client.DefaultRequestHeaders.Add($key, $value)
        }
      }
    }

    if ($null -ne $Fields) {
      foreach ($key in $Fields.Keys) {
        $fieldContent = New-Object System.Net.Http.StringContent([string]$Fields[$key], [System.Text.Encoding]::UTF8)
        $content.Add($fieldContent, $key)
      }
    }

    $stream = [System.IO.File]::OpenRead($FilePath)
    $fileContent = New-Object System.Net.Http.StreamContent($stream)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($ContentType)
    $content.Add($fileContent, $FileFieldName, [System.IO.Path]::GetFileName($FilePath))

    $response = $client.PostAsync($Uri, $content).GetAwaiter().GetResult()
    $payload = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Multipart POST falhou em $Uri. Status=$([int]$response.StatusCode) Payload=$payload"
    }
    if ([string]::IsNullOrWhiteSpace($payload)) { return $null }
    return ($payload | ConvertFrom-Json)
  } finally {
    if ($null -ne $stream) { $stream.Dispose() }
    $content.Dispose()
    $client.Dispose()
  }
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
    return $login
  } catch {
    return $null
  }
}

function Ensure-AdminLogin {
  param(
    [string]$BaseUrl,
    [string]$Email,
    [string]$Senha,
    [string]$Nome,
    [string]$RegistroProf
  )

  $attemptEmail = $Email
  $login = Try-Login -Email $attemptEmail -Senha $Senha -BaseUrl $BaseUrl
  if ($login) {
    $candidateHeaders = @{ Authorization = "Bearer $($login.token)" }
    $candidateMe = Invoke-JsonGet -Uri "$BaseUrl/auth/me" -Headers $candidateHeaders
    if ($candidateMe.role -eq "ADMIN") {
      return @{
        Email = $attemptEmail
        Login = $login
      }
    }

    $attemptEmail = New-RandomEmail $Email
    $login = $null
  }

  if (-not $login) {
    try {
      Invoke-JsonPost -Uri "$BaseUrl/auth/registro" -Body @{
        nome = $Nome
        email = $attemptEmail
        senha = $Senha
        registroProf = $RegistroProf
        conselhoSigla = "CREFITO"
        conselhoUf = "SP"
        especialidade = "Administracao clinica"
        role = "ADMIN"
        consentProfessionalLgpdRequired = $true
      } | Out-Null
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        $attemptEmail = New-RandomEmail $Email
        Invoke-JsonPost -Uri "$BaseUrl/auth/registro" -Body @{
          nome = $Nome
          email = $attemptEmail
          senha = $Senha
          registroProf = "$RegistroProf-$((Get-Random -Minimum 1000 -Maximum 9999))"
          conselhoSigla = "CREFITO"
          conselhoUf = "SP"
          especialidade = "Administracao clinica"
          role = "ADMIN"
          consentProfessionalLgpdRequired = $true
        } | Out-Null
      } else {
        throw
      }
    }

    $login = Try-Login -Email $attemptEmail -Senha $Senha -BaseUrl $BaseUrl
    if (-not $login) {
      throw "Falha ao autenticar admin apos registro."
    }
  }

  return @{
    Email = $attemptEmail
    Login = $login
  }
}

Write-Host "Login..."
$loginResponse = Try-Login -Email $Email -Senha $Senha -BaseUrl $BaseUrl
if (-not $loginResponse) {
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
  $loginResponse = Try-Login -Email $Email -Senha $Senha -BaseUrl $BaseUrl
  if (-not $loginResponse) {
    throw "Falha ao autenticar apos registro."
  }
}

$token = $loginResponse.token
if (-not $token -or -not $loginResponse.refreshToken) {
  throw "Login nao retornou token e refreshToken."
}

$headers = @{ Authorization = "Bearer $token" }

Write-Host "Validando perfil autenticado e refresh token..."
$me = Invoke-JsonGet -Uri "$BaseUrl/auth/me" -Headers $headers
if (-not $me.id -or $me.email -ne $Email) {
  throw "auth/me retornou usuario inesperado."
}

$refreshedLogin = Invoke-JsonPost -Uri "$BaseUrl/auth/refresh" -Body @{
  refreshToken = $loginResponse.refreshToken
} -Depth 4
if (-not $refreshedLogin.token -or -not $refreshedLogin.refreshToken) {
  throw "Refresh token nao retornou nova sessao."
}
$token = $refreshedLogin.token
$headers = @{ Authorization = "Bearer $token" }

Assert-JsonRequestFails `
  -Method Post `
  -Uri "$BaseUrl/auth/refresh" `
  -Body @{ refreshToken = "refresh-invalido" } `
  -ExpectedStatus 401 `
  -Label "Refresh token invalido" `
  -Depth 4

if ([string]::IsNullOrWhiteSpace($AdminSenha)) {
  $AdminSenha = $Senha
}

Write-Host "Validando perfil admin e CRM..."
if ($me.role -ne "ADMIN") {
  Assert-JsonRequestFails `
    -Method Get `
    -Uri "$BaseUrl/crm/pipeline/summary" `
    -Headers $headers `
    -ExpectedStatus 403 `
    -Label "Profissional sem perfil admin acessando CRM"
}

$adminSession = Ensure-AdminLogin `
  -BaseUrl $BaseUrl `
  -Email $AdminEmail `
  -Senha $AdminSenha `
  -Nome $AdminNome `
  -RegistroProf $AdminRegistroProf
$adminLogin = $adminSession.Login
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.token)" }
$adminMe = Invoke-JsonGet -Uri "$BaseUrl/auth/me" -Headers $adminHeaders
if ($adminMe.role -ne "ADMIN") {
  throw "Usuario admin retornou role inesperada: $($adminMe.role)"
}

Invoke-JsonGet -Uri "$BaseUrl/crm/pipeline/summary" -Headers $adminHeaders | Out-Null
Invoke-JsonGet -Uri "$BaseUrl/crm/command-center?windowDays=7&semEvolucaoDias=10&limit=5" -Headers $adminHeaders | Out-Null
Invoke-JsonGet -Uri "$BaseUrl/crm/clinical/dashboard-summary?windowDays=7&semEvolucaoDias=10" -Headers $adminHeaders | Out-Null
Invoke-JsonGet -Uri "$BaseUrl/crm/automations/metrics?windowDays=30" -Headers $adminHeaders | Out-Null
Invoke-JsonGet -Uri "$BaseUrl/crm/admin/profissionais-paged?page=1&limit=5" -Headers $adminHeaders | Out-Null
Invoke-JsonGet -Uri "$BaseUrl/crm/admin/pacientes-paged?page=1&limit=5" -Headers $adminHeaders | Out-Null

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
if (-not $registroPaciente.pacienteId) {
  throw "Registro por convite nao retornou pacienteId."
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

Write-Host "Validando perfil do paciente e isolamento de permissoes..."
$pacienteAuthMe = Invoke-JsonGet -Uri "$BaseUrl/auth/me" -Headers $pacienteHeaders
if ($pacienteAuthMe.role -ne "PACIENTE") {
  throw "Usuario do paciente retornou role inesperada: $($pacienteAuthMe.role)"
}
$pacienteProfile = Invoke-JsonGet -Uri "$BaseUrl/pacientes/me" -Headers $pacienteHeaders
$profilePacienteId = if ($pacienteProfile.paciente) { $pacienteProfile.paciente.id } else { $null }
$profilePacienteUsuarioId = if ($pacienteProfile.paciente) { $pacienteProfile.paciente.pacienteUsuarioId } else { $null }
if ($profilePacienteId -ne $registroPaciente.pacienteId -or $profilePacienteUsuarioId -ne $pacienteAuthMe.id) {
  $profilePayload = ConvertTo-JsonBody -Body $pacienteProfile -Depth 6
  throw "Perfil do paciente nao corresponde ao paciente vinculado. EsperadoPaciente=$($registroPaciente.pacienteId) RecebidoPaciente=$profilePacienteId EsperadoUsuario=$($pacienteAuthMe.id) RecebidoUsuario=$profilePacienteUsuarioId Payload=$profilePayload"
}
Assert-JsonRequestFails `
  -Method Get `
  -Uri "$BaseUrl/pacientes" `
  -Headers $pacienteHeaders `
  -ExpectedStatus 403 `
  -Label "Paciente acessando listagem profissional de pacientes"

Write-Host "Enviando exame medico pelo app do paciente..."
$tempExamPath = Join-Path $env:TEMP ("synap-smoke-exame-{0}.pdf" -f ([guid]::NewGuid().ToString("N")))
$pdfBytes = [System.Text.Encoding]::ASCII.GetBytes("%PDF-1.4`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Count 0>>endobj`ntrailer<</Root 1 0 R>>`n%%EOF")
[System.IO.File]::WriteAllBytes($tempExamPath, $pdfBytes)
try {
  $exameMedico = Invoke-MultipartPost `
    -Uri "$BaseUrl/pacientes/$pacienteId/exames" `
    -Headers $pacienteHeaders `
    -FilePath $tempExamPath `
    -Fields @{
      tipoExame = "RESSONANCIA"
      observacao = "Smoke: exame medico complementar para correlacao clinica."
      dataExame = "2026-06-01"
    }
  if (-not $exameMedico.id) {
    throw "Upload de exame medico nao retornou id."
  }

  $exames = Invoke-JsonGet -Uri "$BaseUrl/pacientes/$pacienteId/exames" -Headers $pacienteHeaders
  if (@($exames).Count -lt 1) {
    throw "Listagem de exames nao retornou o exame enviado."
  }

  $downloadExame = Invoke-WebRequest -Method Get -Uri "$BaseUrl/pacientes/$pacienteId/exames/$($exameMedico.id)/arquivo" -Headers $pacienteHeaders -UseBasicParsing
  if ($downloadExame.StatusCode -ne 200) {
    throw "Download do exame medico retornou status inesperado: $($downloadExame.StatusCode)"
  }
  $downloadContentType = [string]$downloadExame.Headers["Content-Type"]
  if (-not $downloadContentType.StartsWith("application/pdf")) {
    throw "Download do exame medico retornou Content-Type inesperado: $downloadContentType"
  }
} finally {
  Remove-Item -LiteralPath $tempExamPath -Force -ErrorAction SilentlyContinue
}

if (-not $SkipAiPreview) {
  Write-Host "Gerando pre-visualizacao IA/fallback de laudo..."
  $preview = Invoke-JsonPost -Uri "$BaseUrl/laudos/sugestao-ia" -Headers $headers -Body @{
    pacienteId = $pacienteId
  } -Depth 4
  if (-not $preview.source -or -not $preview.planoTratamentoIA -or -not $preview.diagnosticoFuncional) {
    throw "Preview IA/fallback nao retornou campos clinicos esperados."
  }
  if (@("ai", "rules") -notcontains $preview.source) {
    throw "Preview IA/fallback retornou source inesperado: $($preview.source)"
  }
}

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

Write-Host "Registrando exame fisico estruturado..."
$exameFisicoEstruturado = @{
  versao = "smoke-pre-prod-v1"
  resumo = "Dor anterior no joelho direito com limitacao funcional para agachamento e escadas."
  regioes = @(
    @{
      regiao = "joelho"
      lado = "direito"
      testes = @(
        @{ nome = "agachamento"; resultado = "dor anterior"; intensidadeDor = 7 },
        @{ nome = "step down"; resultado = "controle dinamico reduzido"; intensidadeDor = 6 }
      )
    }
  )
  planoPostural = @{
    frontal = "sem assimetrias relevantes"
    sagital = "evita flexao profunda do joelho direito por dor"
  }
}
$exameFisico = Invoke-JsonPost -Uri "$BaseUrl/laudos/exame-fisico" -Headers $headers -Body @{
  pacienteId = $pacienteId
  exameFisico = (ConvertTo-JsonBody -Body $exameFisicoEstruturado -Depth 10)
  diagnosticoFuncional = "Dor femoropatelar funcional provavel, pendente de correlacao profissional."
  condutas = "Controle de dor, educacao, mobilidade e fortalecimento progressivo."
} -Depth 8
if (-not $exameFisico.id) {
  throw "Exame fisico nao retornou id."
}

$latestExameFisico = Invoke-JsonGet -Uri "$BaseUrl/laudos/exame-fisico?pacienteId=$pacienteId" -Headers $headers
if (-not $latestExameFisico.id) {
  throw "Consulta de exame fisico nao retornou registro."
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
  -Method Get `
  -Uri "$BaseUrl/laudos/self/pdf-plano" `
  -Headers $pacienteHeaders `
  -ExpectedStatus 404 `
  -Label "PDF do plano do paciente antes da publicacao"

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

$planoPdfResponse = Invoke-WebRequest -Method Get -Uri "$BaseUrl/laudos/self/pdf-plano" -Headers $pacienteHeaders -UseBasicParsing
if ($planoPdfResponse.StatusCode -ne 200) {
  throw "PDF do plano publicado retornou status inesperado: $($planoPdfResponse.StatusCode)"
}
$planoPdfContentType = [string]$planoPdfResponse.Headers["Content-Type"]
if (-not $planoPdfContentType.StartsWith("application/pdf")) {
  throw "PDF do plano publicado retornou Content-Type inesperado: $planoPdfContentType"
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
