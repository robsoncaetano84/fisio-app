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

function New-RandomEmail {
  param([string]$BaseEmail)
  $parts = $BaseEmail.Split("@");
  if ($parts.Length -ne 2) { return $BaseEmail }
  $rand = Get-Random -Minimum 1000 -Maximum 9999
  return "{0}+{1}@{2}" -f $parts[0], $rand, $parts[1]
}

function Try-Login {
  param([string]$Email, [string]$Senha, [string]$BaseUrl)
  $loginBody = @{ email = $Email; senha = $Senha } | ConvertTo-Json
  try {
    $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Body $loginBody
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
    } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/registro" -ContentType "application/json" -Body $registroBody | Out-Null
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
      } | ConvertTo-Json
      Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/registro" -ContentType "application/json" -Body $registroBody | Out-Null
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
  $digits = 1..11 | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 }
  $cpfValue = ($digits -join '')
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
} | ConvertTo-Json -Depth 6

$paciente = Invoke-RestMethod -Method Post -Uri "$BaseUrl/pacientes" -Headers $headers -ContentType "application/json" -Body $pacienteBody
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
  historicoFamiliar = "sem historico"
} | ConvertTo-Json -Depth 6

$anamnese = Invoke-RestMethod -Method Post -Uri "$BaseUrl/anamneses" -Headers $headers -ContentType "application/json" -Body $anamneseBody
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
} | ConvertTo-Json -Depth 6

$evolucao = Invoke-RestMethod -Method Post -Uri "$BaseUrl/evolucoes" -Headers $headers -ContentType "application/json" -Body $evolucaoBody
$evolucaoId = $evolucao.id
Write-Host "Evolucao criada: $evolucaoId"

Write-Host "OK: fluxo completo executado."


