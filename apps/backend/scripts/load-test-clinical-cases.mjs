#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3020/api';
const DEFAULT_PASSWORD = 'Teste1234';
const DEFAULT_CASES = 100;
const DEFAULT_PROFESSIONALS = 20;
const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TIMEOUT_MS = 15000;

const args = parseArgs(process.argv.slice(2));

const config = {
  baseUrl: trimSlash(
    stringArg('base-url', process.env.CLINICAL_CASE_LOAD_BASE_URL, DEFAULT_BASE_URL),
  ),
  runId: safeRunId(stringArg('run-id', process.env.CLINICAL_CASE_LOAD_RUN_ID, '')),
  cases: numberArg('cases', process.env.CLINICAL_CASE_LOAD_CASES, DEFAULT_CASES),
  professionals: numberArg(
    'professionals',
    process.env.CLINICAL_CASE_LOAD_PROFESSIONALS,
    DEFAULT_PROFESSIONALS,
  ),
  concurrency: numberArg(
    'concurrency',
    process.env.CLINICAL_CASE_LOAD_CONCURRENCY,
    DEFAULT_CONCURRENCY,
  ),
  timeoutMs: numberArg(
    'timeout-ms',
    process.env.CLINICAL_CASE_LOAD_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  ),
  linkedRatio: numberArg(
    'linked-ratio',
    process.env.CLINICAL_CASE_LOAD_LINKED_RATIO,
    0.5,
  ),
  reportFile: stringArg(
    'report-file',
    process.env.CLINICAL_CASE_LOAD_REPORT_FILE,
    '',
  ),
  csvFile: stringArg('csv-file', process.env.CLINICAL_CASE_LOAD_CSV_FILE, ''),
  useVirtualIps: boolArg(
    'use-virtual-ips',
    process.env.CLINICAL_CASE_LOAD_USE_VIRTUAL_IPS,
    true,
  ),
};

if (!config.runId) {
  config.runId = `cases-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
}

let metrics;

async function main() {
  if (config.cases < 100) {
    throw new Error('Use pelo menos 100 casos para este teste.');
  }

  metrics = new Metrics();
  printPlan();

  await assertHealth();

  const professionals = await createProfessionals();
  const caseIndexes = Array.from({ length: config.cases }, (_, index) => index + 1);
  const cases = await parallelMap(caseIndexes, config.concurrency, (caseIndex) =>
    createClinicalCase(caseIndex, professionals[(caseIndex - 1) % professionals.length]),
  );

  const summary = buildSummary(cases);
  writeReports(summary);
  printSummary(summary);

  if (summary.failedCases > 0) {
    throw new Error(`${summary.failedCases} caso(s) falharam.`);
  }
}

async function assertHealth() {
  await request({
    method: 'GET',
    path: '/health/ready',
    label: 'health_ready',
    category: 'read',
    expectedStatuses: [200],
    vuId: 0,
  });
}

async function createProfessionals() {
  console.log(`Creating ${config.professionals} professionals...`);
  const indexes = Array.from(
    { length: config.professionals },
    (_, index) => index + 1,
  );
  return parallelMap(indexes, Math.min(config.concurrency, 5), async (index) => {
    const email = `load.prof.${config.runId}.${index}@teste.com`;
    const body = {
      nome: `Profissional Load ${config.runId} ${index}`,
      email,
      senha: DEFAULT_PASSWORD,
      conselhoSigla: 'CREFITO',
      conselhoUf: 'SP',
      registroProf: `CREFITO-LC-${config.runId}-${index}`,
      especialidade: index % 2 === 0 ? 'Fisioterapia esportiva' : 'Fisioterapia ortopedica',
      role: 'USER',
      consentProfessionalLgpdRequired: true,
    };

    await request({
      method: 'POST',
      path: '/auth/registro',
      body,
      label: 'professional_register',
      category: 'write',
      expectedStatuses: [200, 201],
      vuId: 10000 + index,
    });

    const session = await login({
      email,
      password: DEFAULT_PASSWORD,
      label: 'professional_login',
      vuId: 11000 + index,
    });

    const me = await request({
      method: 'GET',
      path: '/auth/me',
      token: session.token,
      label: 'professional_me',
      category: 'read',
      vuId: 12000 + index,
    });

    if (me.role !== 'USER') {
      throw new Error(`Profissional ${email} retornou role ${me.role}`);
    }

    return {
      index,
      id: me.id,
      nome: me.nome,
      email,
      token: session.token,
      refreshToken: session.refreshToken,
      registroProf: body.registroProf,
    };
  });
}

async function createClinicalCase(caseIndex, professional) {
  const linked = caseIndex <= Math.round(config.cases * config.linkedRatio);
  const caseCode = `${config.runId}-${String(caseIndex).padStart(3, '0')}`;
  const startedAt = performance.now();
  const result = {
    caseIndex,
    caseCode,
    linked,
    status: 'FAILED',
    professionalId: professional.id,
    professionalEmail: professional.email,
    patientId: null,
    patientName: `Paciente Load ${caseCode}`,
    patientCpf: makeCpf(caseIndex),
    patientAppEmail: linked ? `load.patient.${caseCode}@teste.com` : '',
    anamneseId: null,
    patientAnamneseId: null,
    evolucaoId: null,
    atividadeId: null,
    checkinId: null,
    errors: [],
    durationMs: 0,
  };

  try {
    const patient = await request({
      method: 'POST',
      path: '/pacientes',
      token: professional.token,
      body: makePatientPayload(result),
      label: linked ? 'linked_patient_create' : 'unlinked_patient_create',
      category: 'write',
      vuId: caseIndex,
    });
    result.patientId = patient.id;

    const anamnese = await request({
      method: 'POST',
      path: '/anamneses',
      token: professional.token,
      body: makeProfessionalAnamnesePayload(patient.id, caseIndex),
      label: 'professional_anamnesis_create',
      category: 'write',
      vuId: 20000 + caseIndex,
    });
    result.anamneseId = anamnese.id;

    const evolucao = await request({
      method: 'POST',
      path: '/evolucoes',
      token: professional.token,
      body: makeEvolucaoPayload(patient.id, caseIndex),
      label: 'evolution_create',
      category: 'write',
      vuId: 30000 + caseIndex,
    });
    result.evolucaoId = evolucao.id;

    const atividade = await request({
      method: 'POST',
      path: '/atividades',
      token: professional.token,
      body: makeAtividadePayload(patient.id, caseIndex),
      label: 'activity_create',
      category: 'write',
      vuId: 40000 + caseIndex,
    });
    result.atividadeId = atividade.id;

    if (linked) {
      const invite = await request({
        method: 'POST',
        path: '/auth/paciente-convite',
        token: professional.token,
        body: { pacienteId: patient.id, diasExpiracao: 7 },
        label: 'patient_invite_create',
        category: 'write',
        vuId: 50000 + caseIndex,
      });

      const patientSession = await request({
        method: 'POST',
        path: '/auth/registro-paciente-convite',
        body: {
          conviteToken: invite.token,
          nome: `${result.patientName} App`,
          email: result.patientAppEmail,
          senha: DEFAULT_PASSWORD,
          consentTermsRequired: true,
          consentPrivacyRequired: true,
          consentResearchOptional: false,
          consentAiOptional: true,
        },
        label: 'patient_invite_signup',
        category: 'write',
        vuId: 60000 + caseIndex,
      });

      await request({
        method: 'PATCH',
        path: `/pacientes/${patient.id}`,
        token: professional.token,
        body: { anamneseLiberadaPaciente: true },
        label: 'release_patient_anamnesis',
        category: 'write',
        vuId: 70000 + caseIndex,
      });

      const patientProfile = await request({
        method: 'GET',
        path: '/pacientes/me',
        token: patientSession.token,
        label: 'linked_patient_profile',
        category: 'read',
        vuId: 80000 + caseIndex,
      });
      if (patientProfile?.paciente?.id !== patient.id) {
        throw new Error('Perfil vinculado nao corresponde ao paciente criado.');
      }

      const patientAnamnese = await request({
        method: 'POST',
        path: '/anamneses/me',
        token: patientSession.token,
        body: makePatientAnamnesePayload(caseIndex),
        label: 'patient_anamnesis_create',
        category: 'write',
        vuId: 90000 + caseIndex,
      });
      result.patientAnamneseId = patientAnamnese.id;

      const checkin = await request({
        method: 'POST',
        path: `/atividades/${atividade.id}/checkins`,
        token: patientSession.token,
        body: makeCheckinPayload(caseIndex),
        label: 'patient_checkin_create',
        category: 'write',
        vuId: 100000 + caseIndex,
      });
      result.checkinId = checkin.id;
    } else {
      const detail = await request({
        method: 'GET',
        path: `/pacientes/${patient.id}`,
        token: professional.token,
        label: 'unlinked_patient_detail',
        category: 'read',
        vuId: 110000 + caseIndex,
      });
      if (detail.pacienteUsuarioId) {
        throw new Error('Paciente esperado sem vinculo retornou pacienteUsuarioId.');
      }
    }

    result.status = 'OK';
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    result.durationMs = Math.round(performance.now() - startedAt);
  }

  return result;
}

async function login({ email, password, label, vuId }) {
  const response = await request({
    method: 'POST',
    path: '/auth/login',
    body: { identificador: email, senha: password },
    label,
    category: 'write',
    vuId,
  });
  if (!response.token || !response.refreshToken) {
    throw new Error(`${label} nao retornou token e refreshToken.`);
  }
  return response;
}

async function request({
  method,
  path,
  token,
  body,
  label,
  category,
  expectedStatuses = [200, 201],
  vuId,
}) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = {
    'User-Agent': `synap-clinical-case-load/${config.runId}`,
    ...virtualIpHeaders(vuId),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';

  let status = 0;
  let ok = false;
  let responseText = '';
  let parsed = null;
  let errorMessage = '';

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    status = response.status;
    responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (responseText && contentType.includes('application/json')) {
      parsed = JSON.parse(responseText);
    } else {
      parsed = responseText;
    }
    ok = expectedStatuses.includes(status);
    if (!ok) errorMessage = shortText(responseText, 220);
  } catch (error) {
    errorMessage = error?.name === 'AbortError' ? 'timeout' : String(error?.message || error);
  } finally {
    clearTimeout(timer);
  }

  const durationMs = Math.round(performance.now() - startedAt);
  metrics.record({ label, category, method, path, status, ok, durationMs, errorMessage });

  if (!ok) {
    throw new Error(`${label} falhou status=${status} erro=${errorMessage}`);
  }

  return parsed;
}

class Metrics {
  constructor() {
    this.samples = [];
  }

  record(sample) {
    this.samples.push(sample);
  }

  summary() {
    return {
      totalRequests: this.samples.length,
      failedRequests: this.samples.filter((sample) => !sample.ok).length,
      byOperation: groupSummary(this.samples, 'label'),
      byCategory: groupSummary(this.samples, 'category'),
    };
  }
}

function buildSummary(cases) {
  const metricsSummary = metrics.summary();
  const linkedCases = cases.filter((item) => item.linked);
  const unlinkedCases = cases.filter((item) => !item.linked);
  const failed = cases.filter((item) => item.status !== 'OK');
  return {
    runId: config.runId,
    baseUrl: config.baseUrl,
    generatedAt: new Date().toISOString(),
    requestedCases: config.cases,
    professionals: config.professionals,
    createdCases: cases.length,
    successfulCases: cases.length - failed.length,
    failedCases: failed.length,
    linkedCases: linkedCases.length,
    unlinkedCases: unlinkedCases.length,
    metrics: metricsSummary,
    cases,
  };
}

function writeReports(summary) {
  const reportFile =
    config.reportFile ||
    resolve(process.cwd(), '..', '..', '.local-logs', `clinical-cases-${config.runId}.json`);
  const csvFile =
    config.csvFile ||
    resolve(process.cwd(), '..', '..', '.local-logs', `clinical-cases-${config.runId}.csv`);

  mkdirSync(dirname(reportFile), { recursive: true });
  mkdirSync(dirname(csvFile), { recursive: true });
  writeFileSync(reportFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  writeFileSync(csvFile, toCsv(summary.cases), 'utf8');
  console.log(`JSON report: ${reportFile}`);
  console.log(`CSV report: ${csvFile}`);
}

function printPlan() {
  console.log('Clinical cases load test');
  console.log(`  baseUrl: ${config.baseUrl}`);
  console.log(`  runId: ${config.runId}`);
  console.log(`  professionals: ${config.professionals}`);
  console.log(`  cases: ${config.cases}`);
  console.log(`  linked target: ${Math.round(config.cases * config.linkedRatio)}`);
  console.log(`  unlinked target: ${config.cases - Math.round(config.cases * config.linkedRatio)}`);
  console.log(`  concurrency: ${config.concurrency}`);
  console.log(`  virtual IPs: ${config.useVirtualIps ? 'enabled' : 'disabled'}`);
}

function printSummary(summary) {
  console.log('Clinical cases load result');
  console.log(`  cases: ${summary.successfulCases}/${summary.createdCases} OK`);
  console.log(`  linked: ${summary.linkedCases}`);
  console.log(`  unlinked: ${summary.unlinkedCases}`);
  console.log(
    `  requests: ${summary.metrics.totalRequests} total, ${summary.metrics.failedRequests} failed`,
  );
}

function makePatientPayload(item) {
  return {
    nomeCompleto: item.patientName,
    cpf: item.patientCpf,
    rg: `${7000000 + item.caseIndex}`,
    dataNascimento: '1990-01-01',
    sexo: item.caseIndex % 2 === 0 ? 'FEMININO' : 'MASCULINO',
    estadoCivil: 'SOLTEIRO',
    profissao: item.caseIndex % 3 === 0 ? 'Professor' : 'Analista',
    contatoWhatsapp: `1198${String(1000000 + item.caseIndex).slice(0, 7)}`,
    contatoTelefone: `1132${String(1000000 + item.caseIndex).slice(0, 7)}`,
    contatoEmail: `load.patient.${item.caseCode}@teste.com`,
    enderecoCep: '01001000',
    enderecoRua: 'Rua Carga Clinica',
    enderecoNumero: String(item.caseIndex),
    enderecoComplemento: item.linked ? 'Vinculado app' : 'Sem app',
    enderecoBairro: 'Centro',
    enderecoCidade: 'Sao Paulo',
    enderecoUf: 'SP',
  };
}

function makeProfessionalAnamnesePayload(pacienteId, index) {
  return {
    pacienteId,
    motivoBusca: 'SINTOMA_EXISTENTE',
    mecanismoLesao: 'SOBRECARGA',
    areasAfetadas: [{ regiao: index % 2 === 0 ? 'joelho' : 'lombar', lado: 'direito' }],
    intensidadeDor: 4 + (index % 5),
    descricaoSintomas: 'Dor relacionada a carga e atividade funcional.',
    tempoProblema: index % 2 === 0 ? '2 semanas' : '1 mes',
    horaIntensifica: 'fim do dia',
    inicioProblema: 'GRADUAL',
    eventoEspecifico: 'sem trauma direto',
    fatorAlivio: 'repouso relativo',
    fatoresPiora: 'escadas, agachamento e permanencia prolongada',
    problemaAnterior: index % 4 === 0,
    quandoProblemaAnterior: index % 4 === 0 ? 'episodio semelhante ha 1 ano' : '',
    tratamentosAnteriores: ['analgesico eventual', 'repouso'],
  };
}

function makePatientAnamnesePayload(index) {
  return {
    motivoBusca: 'SINTOMA_EXISTENTE',
    mecanismoLesao: 'SOBRECARGA',
    areasAfetadas: [{ regiao: index % 2 === 0 ? 'joelho' : 'lombar', lado: 'direito' }],
    intensidadeDor: 5 + (index % 4),
    descricaoSintomas: 'Dor percebida nas atividades do dia a dia.',
    tempoProblema: index % 2 === 0 ? '2 semanas' : '1 mes',
    horaIntensifica: 'a noite',
    inicioProblema: 'GRADUAL',
    eventoEspecifico: 'sem queda ou trauma',
    fatorAlivio: 'repouso e gelo',
    fatoresPiora: 'subir escadas e agachar',
    problemaAnterior: false,
    quandoProblemaAnterior: '',
    tratamentosAnteriores: ['repouso'],
  };
}

function makeEvolucaoPayload(pacienteId, index) {
  return {
    pacienteId,
    data: new Date().toISOString(),
    listagens: `Evolucao load case ${index}`,
    legCheck: 'sem alteracoes relevantes',
    ajustes: 'educacao em dor e controle de carga',
    orientacoes: 'monitorar sintomas e manter atividade tolerada',
    observacoes: 'registro gerado por teste de carga clinica',
  };
}

function makeAtividadePayload(pacienteId, index) {
  return {
    pacienteId,
    titulo: `Atividade load case ${index}`,
    descricao: 'Exercicio leve com progressao conforme tolerancia.',
    dataLimite: new Date(Date.now() + 7 * 86400000).toISOString(),
    diaPrescricao: (index % 7) + 1,
    ordemNoDia: 1,
    repetirSemanal: true,
    aceiteProfissional: true,
  };
}

function makeCheckinPayload(index) {
  return {
    concluiu: true,
    dorAntes: 5 + (index % 3),
    dorDepois: 3 + (index % 2),
    dificuldade: index % 5 === 0 ? 'DIFICIL' : 'MEDIO',
    tempoMinutos: 10 + (index % 8),
    melhoriaSessao: index % 6 === 0 ? 'MANTEVE' : 'MELHOROU',
    feedbackLivre: 'Check-in criado no teste de carga clinica.',
  };
}

function toCsv(cases) {
  const headers = [
    'caseIndex',
    'caseCode',
    'status',
    'linked',
    'professionalEmail',
    'professionalId',
    'patientName',
    'patientId',
    'patientCpf',
    'patientAppEmail',
    'anamneseId',
    'patientAnamneseId',
    'evolucaoId',
    'atividadeId',
    'checkinId',
    'durationMs',
    'errors',
  ];
  const rows = cases.map((item) =>
    headers.map((header) => csvCell(Array.isArray(item[header]) ? item[header].join(' | ') : item[header])).join(','),
  );
  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function groupSummary(samples, key) {
  const map = new Map();
  for (const sample of samples) {
    const group = map.get(sample[key]) || [];
    group.push(sample);
    map.set(sample[key], group);
  }
  return Object.fromEntries(
    [...map.entries()].map(([name, group]) => [name, summarize(group)]),
  );
}

function summarize(samples) {
  const failed = samples.filter((item) => !item.ok).length;
  const durations = samples.map((item) => item.durationMs);
  return {
    total: samples.length,
    failed,
    p95Ms: percentile(durations, 95),
    maxMs: percentile(durations, 100),
  };
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

async function parallelMap(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function virtualIpHeaders(vuId) {
  if (!config.useVirtualIps) return {};
  const id = Math.max(1, Number(vuId) || 1);
  const ip = `10.${64 + Math.floor(id / 65536)}.${Math.floor(id / 256) % 256}.${(id % 254) + 1}`;
  return {
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
  };
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) continue;
    const [key, ...rest] = arg.slice(2).split('=');
    parsed[key] = rest.length > 0 ? rest.join('=') : true;
  }
  return parsed;
}

function stringArg(name, envValue, fallback) {
  const argValue = args[name];
  if (typeof argValue === 'string') return argValue.trim();
  if (typeof envValue === 'string' && envValue.trim()) return envValue.trim();
  return fallback;
}

function numberArg(name, envValue, fallback) {
  const argValue = args[name];
  const raw = typeof argValue === 'string' ? argValue : envValue;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolArg(name, envValue, fallback) {
  if (args[name] !== undefined) {
    if (args[name] === true) return true;
    return ['1', 'true', 'yes', 'sim'].includes(String(args[name]).toLowerCase());
  }
  if (envValue !== undefined) {
    return ['1', 'true', 'yes', 'sim'].includes(String(envValue).toLowerCase());
  }
  return fallback;
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function safeRunId(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
}

function makeCpf(index) {
  return String(92000000000 + Number(index)).slice(0, 11);
}

function shortText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, max);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
