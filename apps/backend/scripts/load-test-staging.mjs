#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULT_BASE_URL = 'https://api-hml.seudominio.com/api';
const DEFAULT_PASSWORD = 'Teste1234';
const DEFAULT_DURATION_SECONDS = 300;
const DEFAULT_VUS = 300;
const DEFAULT_TARGET_RPS = 45;
const DEFAULT_HEAVY_VUS = 30;
const DEFAULT_HEAVY_RPS = 5;
const DEFAULT_HEAVY_DURATION_SECONDS = 120;
const DEFAULT_PROFILE_COUNT = 300;
const DEFAULT_COMMON_TIMEOUT_MS = 8000;
const DEFAULT_HEAVY_TIMEOUT_MS = 30000;
const DEFAULT_SETUP_CONCURRENCY = 10;
const DEFAULT_ERROR_RATE_MAX = 0.01;
const DEFAULT_READ_P95_MS = 800;
const DEFAULT_WRITE_P95_MS = 1500;

const args = parseArgs(process.argv.slice(2));

const config = {
  baseUrl: trimSlash(
    stringArg('base-url', process.env.LOAD_TEST_BASE_URL, DEFAULT_BASE_URL),
  ),
  adminEmail: stringArg('admin-email', process.env.LOAD_TEST_ADMIN_EMAIL, ''),
  adminPassword: stringArg(
    'admin-password',
    process.env.LOAD_TEST_ADMIN_PASSWORD,
    '',
  ),
  scenario: stringArg('scenario', process.env.LOAD_TEST_SCENARIO, 'all'),
  runId: safeRunId(stringArg('run-id', process.env.LOAD_TEST_RUN_ID, '')),
  vus: numberArg('vus', process.env.LOAD_TEST_VUS, DEFAULT_VUS),
  targetRps: numberArg(
    'target-rps',
    process.env.LOAD_TEST_TARGET_RPS,
    DEFAULT_TARGET_RPS,
  ),
  durationSeconds: numberArg(
    'duration-seconds',
    process.env.LOAD_TEST_DURATION_SECONDS,
    DEFAULT_DURATION_SECONDS,
  ),
  heavyVus: numberArg(
    'heavy-vus',
    process.env.LOAD_TEST_HEAVY_VUS,
    DEFAULT_HEAVY_VUS,
  ),
  heavyRps: numberArg(
    'heavy-rps',
    process.env.LOAD_TEST_HEAVY_RPS,
    DEFAULT_HEAVY_RPS,
  ),
  heavyDurationSeconds: numberArg(
    'heavy-duration-seconds',
    process.env.LOAD_TEST_HEAVY_DURATION_SECONDS,
    DEFAULT_HEAVY_DURATION_SECONDS,
  ),
  profileCount: numberArg(
    'profile-count',
    process.env.LOAD_TEST_PROFILE_COUNT,
    DEFAULT_PROFILE_COUNT,
  ),
  commonTimeoutMs: numberArg(
    'common-timeout-ms',
    process.env.LOAD_TEST_COMMON_TIMEOUT_MS,
    DEFAULT_COMMON_TIMEOUT_MS,
  ),
  heavyTimeoutMs: numberArg(
    'heavy-timeout-ms',
    process.env.LOAD_TEST_HEAVY_TIMEOUT_MS,
    DEFAULT_HEAVY_TIMEOUT_MS,
  ),
  setupConcurrency: numberArg(
    'setup-concurrency',
    process.env.LOAD_TEST_SETUP_CONCURRENCY,
    DEFAULT_SETUP_CONCURRENCY,
  ),
  errorRateMax: numberArg(
    'error-rate-max',
    process.env.LOAD_TEST_ERROR_RATE_MAX,
    DEFAULT_ERROR_RATE_MAX,
  ),
  readP95Ms: numberArg(
    'read-p95-ms',
    process.env.LOAD_TEST_READ_P95_MS,
    DEFAULT_READ_P95_MS,
  ),
  writeP95Ms: numberArg(
    'write-p95-ms',
    process.env.LOAD_TEST_WRITE_P95_MS,
    DEFAULT_WRITE_P95_MS,
  ),
  useVirtualIps: boolArg(
    'use-virtual-ips',
    process.env.LOAD_TEST_USE_VIRTUAL_IPS,
    true,
  ),
  fixturesFile: stringArg('fixtures-file', process.env.LOAD_TEST_FIXTURES_FILE, ''),
  reportFile: stringArg(
    'report-file',
    process.env.LOAD_TEST_REPORT_FILE,
    '',
  ),
  dryRun: Boolean(args['dry-run']) || envBool(process.env.LOAD_TEST_DRY_RUN),
};

if (!config.runId) {
  config.runId = `lt-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
}

if (!['all', 'common', 'heavy'].includes(config.scenario)) {
  fatal(`Invalid scenario "${config.scenario}". Use all, common or heavy.`);
}

let metrics;

async function main() {
  metrics = new Metrics();
  printPlan();

  if (config.dryRun) {
    console.log('Dry-run only. No request was sent.');
    return;
  }

  requireRuntimeConfig();

  const adminSession = await login({
    email: config.adminEmail,
    password: config.adminPassword,
    vuId: 0,
    phase: 'setup',
    scenario: 'setup',
    label: 'admin_login',
  });

  const profiles = await loadOrCreateProfiles(adminSession);

  if (config.scenario === 'common' || config.scenario === 'all') {
    await runCommonScenario(profiles, adminSession);
  }

  if (config.scenario === 'heavy' || config.scenario === 'all') {
    await runHeavyScenario(profiles, adminSession);
  }

  const summary = metrics.summary(config);
  writeReport(summary);
  printSummary(summary);
  assertThresholds(summary);
}

function requireRuntimeConfig() {
  if (!config.baseUrl || config.baseUrl === DEFAULT_BASE_URL) {
    fatal('Set LOAD_TEST_BASE_URL with the staging API URL ending in /api.');
  }
  if (!config.adminEmail) {
    fatal('Set LOAD_TEST_ADMIN_EMAIL with a staging master/admin account.');
  }
  if (!config.adminPassword) {
    fatal('Set LOAD_TEST_ADMIN_PASSWORD with the staging account password.');
  }
}

function printPlan() {
  console.log('Staging load test plan');
  console.log(`  baseUrl: ${redactBaseUrl(config.baseUrl)}`);
  console.log(`  scenario: ${config.scenario}`);
  console.log(`  runId: ${config.runId}`);
  console.log(`  common: ${config.vus} VUs, ${config.targetRps} RPS, ${config.durationSeconds}s`);
  console.log(`  heavy: ${config.heavyVus} VUs, ${config.heavyRps} RPS, ${config.heavyDurationSeconds}s`);
  console.log(`  profiles: ${config.profileCount}`);
  console.log(`  virtual IPs: ${config.useVirtualIps ? 'enabled' : 'disabled'}`);
  console.log(`  thresholds: errors < ${formatPct(config.errorRateMax)}, read p95 < ${config.readP95Ms}ms, write p95 < ${config.writeP95Ms}ms`);
}

async function loadOrCreateProfiles(adminSession) {
  if (config.fixturesFile) {
    const loaded = JSON.parse(readFileSync(resolve(config.fixturesFile), 'utf8'));
    if (!Array.isArray(loaded.profiles) || loaded.profiles.length === 0) {
      fatal('Fixtures file must contain a non-empty "profiles" array.');
    }
    return loaded.profiles;
  }

  console.log(`Creating ${config.profileCount} synthetic clinical profiles...`);
  const indexes = Array.from({ length: config.profileCount }, (_, index) => index + 1);
  return parallelMap(indexes, config.setupConcurrency, (index) =>
    createProfile(index, adminSession),
  );
}

async function createProfile(index, adminSession) {
  const vuId = index;
  const patient = await apiRequest({
    method: 'POST',
    path: '/pacientes',
    token: adminSession.token,
    body: makePatientPayload(index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_create_patient',
    vuId,
  });

  await apiRequest({
    method: 'PATCH',
    path: `/pacientes/${patient.id}`,
    token: adminSession.token,
    body: { anamneseLiberadaPaciente: true },
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_release_anamnesis',
    vuId,
  });

  const professionalAnamnese = await apiRequest({
    method: 'POST',
    path: '/anamneses',
    token: adminSession.token,
    body: makeAnamnesePayload(patient.id, index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_professional_anamnesis',
    vuId,
  });

  await apiRequest({
    method: 'POST',
    path: '/evolucoes',
    token: adminSession.token,
    body: makeEvolucaoPayload(patient.id, index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_evolution',
    vuId,
  });

  const activity = await apiRequest({
    method: 'POST',
    path: '/atividades',
    token: adminSession.token,
    body: makeActivityPayload(patient.id, index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_plan_activity',
    vuId,
  });

  const invite = await apiRequest({
    method: 'POST',
    path: '/auth/paciente-convite',
    token: adminSession.token,
    body: { pacienteId: patient.id, diasExpiracao: 7 },
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_patient_invite',
    vuId,
  });

  const patientEmail = `loadtest.patient.${config.runId}.${index}@teste.com`;
  const patientSession = await apiRequest({
    method: 'POST',
    path: '/auth/registro-paciente-convite',
    body: {
      conviteToken: invite.token,
      nome: `Paciente Load ${index}`,
      email: patientEmail,
      senha: DEFAULT_PASSWORD,
      consentTermsRequired: true,
      consentPrivacyRequired: true,
      consentResearchOptional: false,
      consentAiOptional: true,
    },
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_patient_signup',
    vuId,
  });

  const patientAnamnese = await apiRequest({
    method: 'POST',
    path: '/anamneses/me',
    token: patientSession.token,
    body: makeMyAnamnesePayload(index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_patient_anamnesis',
    vuId,
  });

  const laudo = await apiRequest({
    method: 'POST',
    path: '/laudos',
    token: adminSession.token,
    body: makeLaudoPayload(patient.id, index),
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_laudo',
    vuId,
  });

  await apiRequest({
    method: 'POST',
    path: `/laudos/${laudo.id}/validar`,
    token: adminSession.token,
    body: {},
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_validate_laudo',
    vuId,
  });

  await apiRequest({
    method: 'POST',
    path: `/laudos/${laudo.id}/publicar-paciente`,
    token: adminSession.token,
    body: {},
    category: 'write',
    phase: 'setup',
    scenario: 'setup',
    label: 'setup_publish_laudo',
    vuId,
  });

  return {
    index,
    pacienteId: patient.id,
    laudoId: laudo.id,
    atividadeId: activity.id,
    anamneseId: professionalAnamnese.id,
    patientAnamneseId: patientAnamnese.id,
    professionalSession: {
      email: config.adminEmail,
      password: config.adminPassword,
      token: adminSession.token,
      refreshToken: adminSession.refreshToken,
    },
    patientSession: {
      email: patientEmail,
      password: DEFAULT_PASSWORD,
      token: patientSession.token,
      refreshToken: patientSession.refreshToken,
    },
  };
}

async function runCommonScenario(profiles, adminSession) {
  await runScenario({
    name: 'common',
    vus: config.vus,
    targetRps: config.targetRps,
    durationSeconds: config.durationSeconds,
    profiles,
    operations: commonOperations(adminSession),
  });
}

async function runHeavyScenario(profiles, adminSession) {
  await runScenario({
    name: 'heavy',
    vus: config.heavyVus,
    targetRps: config.heavyRps,
    durationSeconds: config.heavyDurationSeconds,
    profiles,
    operations: heavyOperations(adminSession),
  });
}

async function runScenario({ name, vus, targetRps, durationSeconds, profiles, operations }) {
  console.log(`Running ${name}: ${vus} VUs, ${targetRps} RPS, ${durationSeconds}s`);
  const gate = new RpsGate(targetRps);
  const deadline = Date.now() + durationSeconds * 1000;
  const workers = Array.from({ length: vus }, (_, workerIndex) =>
    scenarioWorker({
      workerIndex,
      deadline,
      gate,
      profiles,
      operations,
      scenario: name,
    }),
  );
  await Promise.all(workers);
}

async function scenarioWorker({ workerIndex, deadline, gate, profiles, operations, scenario }) {
  const profile = profiles[workerIndex % profiles.length];
  const vuId = workerIndex + 1;
  while (Date.now() < deadline) {
    const admitted = await gate.take(deadline);
    if (!admitted) return;
    const operation = pickWeighted(operations);
    try {
      await operation.run({ profile, vuId, scenario });
    } catch {
      // apiRequest already records the failure. Keep the VU alive.
    }
  }
}

function commonOperations(adminSession) {
  return [
    weighted('auth_me_professional', 4, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/auth/me',
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'auth_me_professional',
        vuId,
      }),
    ),
    weighted('refresh_patient', 6, async ({ profile, vuId, scenario }) => {
      profile.patientSession = await refreshSession({
        session: profile.patientSession,
        vuId,
        scenario,
        label: 'refresh_patient',
      });
    }),
    weighted('login_patient', 2, async ({ profile, vuId, scenario }) => {
      profile.patientSession = await login({
        email: profile.patientSession.email,
        password: profile.patientSession.password,
        vuId,
        phase: 'load',
        scenario,
        label: 'login_patient',
      });
    }),
    weighted('login_professional_admin', 1, async ({ profile, vuId, scenario }) => {
      profile.professionalSession = await login({
        email: config.adminEmail,
        password: config.adminPassword,
        vuId,
        phase: 'load',
        scenario,
        label: 'login_professional_admin',
      });
      adminSession.token = profile.professionalSession.token;
      adminSession.refreshToken = profile.professionalSession.refreshToken;
    }),
    weighted('patients_paged', 8, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/pacientes/paged?page=1&limit=20',
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'patients_paged',
        vuId,
      }),
    ),
    weighted('patient_detail', 8, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/pacientes/${profile.pacienteId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'patient_detail',
        vuId,
      }),
    ),
    weighted('patient_home', 5, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/pacientes/me',
        token: profile.patientSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'patient_home',
        vuId,
      }),
    ),
    weighted('anamneses_list', 7, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/anamneses?pacienteId=${profile.pacienteId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'anamneses_list',
        vuId,
      }),
    ),
    weighted('patient_anamnesis_latest', 5, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/anamneses/me/latest',
        token: profile.patientSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'patient_anamnesis_latest',
        vuId,
      }),
    ),
    weighted('patient_anamnesis_write', 2, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'POST',
        path: '/anamneses/me',
        token: profile.patientSession.token,
        body: makeMyAnamnesePayload(vuId),
        category: 'write',
        phase: 'load',
        scenario,
        label: 'patient_anamnesis_write',
        vuId,
      }),
    ),
    weighted('evolutions_list', 7, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/evolucoes?pacienteId=${profile.pacienteId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'evolutions_list',
        vuId,
      }),
    ),
    weighted('evolution_write', 2, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'POST',
        path: '/evolucoes',
        token: profile.professionalSession.token,
        body: makeEvolucaoPayload(profile.pacienteId, vuId),
        category: 'write',
        phase: 'load',
        scenario,
        label: 'evolution_write',
        vuId,
      }),
    ),
    weighted('plan_activities_professional', 6, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/atividades?pacienteId=${profile.pacienteId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'plan_activities_professional',
        vuId,
      }),
    ),
    weighted('plan_activities_patient', 6, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/atividades/minhas',
        token: profile.patientSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'plan_activities_patient',
        vuId,
      }),
    ),
    weighted('activity_checkin_write', 3, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'POST',
        path: `/atividades/${profile.atividadeId}/checkins`,
        token: profile.patientSession.token,
        body: makeCheckinPayload(vuId),
        category: 'write',
        phase: 'load',
        scenario,
        label: 'activity_checkin_write',
        vuId,
      }),
    ),
    weighted('laudos_list', 6, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/laudos?pacienteId=${profile.pacienteId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'laudos_list',
        vuId,
      }),
    ),
    weighted('laudo_detail', 4, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/laudos/${profile.laudoId}`,
        token: profile.professionalSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'laudo_detail',
        vuId,
      }),
    ),
    weighted('laudo_write', 1, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'POST',
        path: '/laudos',
        token: profile.professionalSession.token,
        body: makeLaudoPayload(profile.pacienteId, vuId),
        category: 'write',
        phase: 'load',
        scenario,
        label: 'laudo_write',
        vuId,
      }),
    ),
    weighted('crm_command_center', 3, ({ vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/crm/command-center?windowDays=7&semEvolucaoDias=10&limit=8',
        token: adminSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'crm_command_center',
        vuId,
      }),
    ),
    weighted('crm_clinical_dashboard', 3, ({ vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/crm/clinical/dashboard-summary?windowDays=7&semEvolucaoDias=10',
        token: adminSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'crm_clinical_dashboard',
        vuId,
      }),
    ),
    weighted('crm_automations_metrics', 2, ({ vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/crm/automations/metrics?windowDays=30',
        token: adminSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'crm_automations_metrics',
        vuId,
      }),
    ),
    weighted('crm_admin_pacientes_paged', 2, ({ vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/crm/admin/pacientes-paged?page=1&limit=20',
        token: adminSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'crm_admin_pacientes_paged',
        vuId,
      }),
    ),
    weighted('crm_pipeline_summary', 2, ({ vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/crm/pipeline/summary',
        token: adminSession.token,
        category: 'read',
        phase: 'load',
        scenario,
        label: 'crm_pipeline_summary',
        vuId,
      }),
    ),
  ];
}

function heavyOperations(adminSession) {
  return [
    weighted('ai_laudo_suggestion', 2, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'POST',
        path: '/laudos/sugestao-ia',
        token: adminSession.token,
        body: { pacienteId: profile.pacienteId },
        category: 'heavy',
        phase: 'load',
        scenario,
        label: 'ai_laudo_suggestion',
        timeoutMs: config.heavyTimeoutMs,
        vuId,
      }),
    ),
    weighted('pdf_laudo_professional', 2, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/laudos/${profile.laudoId}/pdf-laudo`,
        token: adminSession.token,
        category: 'heavy',
        phase: 'load',
        scenario,
        label: 'pdf_laudo_professional',
        timeoutMs: config.heavyTimeoutMs,
        accept: 'application/pdf',
        vuId,
      }),
    ),
    weighted('pdf_plano_professional', 2, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/laudos/${profile.laudoId}/pdf-plano`,
        token: adminSession.token,
        category: 'heavy',
        phase: 'load',
        scenario,
        label: 'pdf_plano_professional',
        timeoutMs: config.heavyTimeoutMs,
        accept: 'application/pdf',
        vuId,
      }),
    ),
    weighted('pdf_laudo_patient', 1, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: '/laudos/self/pdf-laudo',
        token: profile.patientSession.token,
        category: 'heavy',
        phase: 'load',
        scenario,
        label: 'pdf_laudo_patient',
        timeoutMs: config.heavyTimeoutMs,
        accept: 'application/pdf',
        vuId,
      }),
    ),
    weighted('exam_upload', 2, ({ profile, vuId, scenario }) =>
      uploadExam({ profile, vuId, scenario }),
    ),
    weighted('exam_list', 1, ({ profile, vuId, scenario }) =>
      apiRequest({
        method: 'GET',
        path: `/pacientes/${profile.pacienteId}/exames`,
        token: profile.patientSession.token,
        category: 'heavy',
        phase: 'load',
        scenario,
        label: 'exam_list',
        timeoutMs: config.heavyTimeoutMs,
        vuId,
      }),
    ),
  ];
}

async function uploadExam({ profile, vuId, scenario }) {
  const form = new FormData();
  form.set('tipoExame', 'RESSONANCIA');
  form.set('observacao', `Load test ${config.runId} VU ${vuId}`);
  form.set('dataExame', '2026-06-01');
  form.set(
    'file',
    new Blob([minimalPdfBytes()], { type: 'application/pdf' }),
    `load-test-${config.runId}-${vuId}.pdf`,
  );

  return apiRequest({
    method: 'POST',
    path: `/pacientes/${profile.pacienteId}/exames`,
    token: profile.patientSession.token,
    form,
    category: 'heavy',
    phase: 'load',
    scenario,
    label: 'exam_upload',
    timeoutMs: config.heavyTimeoutMs,
    vuId,
  });
}

async function login({ email, password, vuId, phase, scenario, label }) {
  const response = await apiRequest({
    method: 'POST',
    path: '/auth/login',
    body: { identificador: email, senha: password },
    category: 'write',
    phase,
    scenario,
    label,
    vuId,
  });
  assertSession(response, label);
  return { email, password, token: response.token, refreshToken: response.refreshToken };
}

async function refreshSession({ session, vuId, scenario, label }) {
  const response = await apiRequest({
    method: 'POST',
    path: '/auth/refresh',
    body: { refreshToken: session.refreshToken },
    category: 'write',
    phase: 'load',
    scenario,
    label,
    vuId,
  });
  assertSession(response, label);
  return {
    ...session,
    token: response.token,
    refreshToken: response.refreshToken,
  };
}

async function apiRequest({
  method,
  path,
  token,
  body,
  form,
  category,
  phase,
  scenario,
  label,
  timeoutMs,
  expectedStatuses,
  accept,
  vuId,
}) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || config.commonTimeoutMs);
  const url = `${config.baseUrl}${path}`;
  const headers = {
    'User-Agent': `synap-load-test/${config.runId}`,
    ...virtualIpHeaders(vuId),
  };
  if (accept) headers.Accept = accept;
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;

  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    payload = JSON.stringify(body);
  }

  const expected = expectedStatuses || (method === 'POST' ? [200, 201] : [200]);
  let status = 0;
  let ok = false;
  let responseText = '';
  let parsed;
  let errorMessage = '';

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
    status = response.status;
    ok = expected.includes(status);
    responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (accept && !contentType.toLowerCase().includes(accept.toLowerCase())) {
      ok = false;
      errorMessage = `Unexpected content-type ${contentType}`;
    }

    if (responseText && contentType.includes('application/json')) {
      parsed = JSON.parse(responseText);
    } else {
      parsed = responseText;
    }

    if (!ok && !errorMessage) {
      errorMessage = shortPayload(responseText);
    }
  } catch (error) {
    ok = false;
    errorMessage = error?.name === 'AbortError' ? 'timeout' : String(error?.message || error);
  } finally {
    clearTimeout(timer);
  }

  const durationMs = performance.now() - start;
  metrics.record({
    label,
    method,
    path,
    status,
    ok,
    category,
    phase,
    scenario,
    durationMs,
    errorMessage,
  });

  if (!ok) {
    throw new Error(`${label} failed status=${status} error=${errorMessage}`);
  }

  return parsed;
}

class RpsGate {
  constructor(targetRps) {
    this.intervalMs = 1000 / targetRps;
    this.nextAt = Date.now();
  }

  async take(deadline) {
    const scheduledAt = this.nextAt;
    this.nextAt += this.intervalMs;
    if (scheduledAt > deadline) return false;
    const waitMs = Math.max(0, scheduledAt - Date.now());
    if (waitMs > 0) await sleep(waitMs);
    return Date.now() <= deadline + 1000;
  }
}

class Metrics {
  constructor() {
    this.samples = [];
  }

  record(sample) {
    this.samples.push(sample);
  }

  summary(cfg) {
    const loadSamples = this.samples.filter((sample) => sample.phase === 'load');
    const setupSamples = this.samples.filter((sample) => sample.phase === 'setup');
    return {
      runId: cfg.runId,
      baseUrl: redactBaseUrl(cfg.baseUrl),
      generatedAt: new Date().toISOString(),
      thresholds: {
        errorRateMax: cfg.errorRateMax,
        readP95Ms: cfg.readP95Ms,
        writeP95Ms: cfg.writeP95Ms,
      },
      setup: summarizeSamples(setupSamples),
      load: summarizeSamples(loadSamples),
      byScenario: groupSummaries(loadSamples, 'scenario'),
      byCategory: groupSummaries(loadSamples, 'category'),
      byOperation: groupSummaries(loadSamples, 'label'),
      errors: loadSamples
        .filter((sample) => !sample.ok)
        .slice(0, 50)
        .map(({ label, method, path, status, durationMs, errorMessage }) => ({
          label,
          method,
          path,
          status,
          durationMs: Math.round(durationMs),
          errorMessage,
        })),
    };
  }
}

function summarizeSamples(samples) {
  const durations = samples.map((sample) => sample.durationMs);
  const failed = samples.filter((sample) => !sample.ok).length;
  const total = samples.length;
  return {
    total,
    ok: total - failed,
    failed,
    errorRate: total === 0 ? 0 : failed / total,
    minMs: percentile(durations, 0),
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    maxMs: percentile(durations, 100),
  };
}

function groupSummaries(samples, key) {
  const groups = new Map();
  for (const sample of samples) {
    const value = sample[key] || 'unknown';
    const group = groups.get(value) || [];
    group.push(sample);
    groups.set(value, group);
  }
  return Object.fromEntries(
    [...groups.entries()].map(([name, group]) => [name, summarizeSamples(group)]),
  );
}

function assertThresholds(summary) {
  const failures = [];
  if (summary.load.total === 0) {
    failures.push('No load sample was recorded.');
  }
  if (summary.load.errorRate > config.errorRateMax) {
    failures.push(
      `Global error rate ${formatPct(summary.load.errorRate)} exceeded ${formatPct(config.errorRateMax)}.`,
    );
  }
  const read = summary.byCategory.read;
  if (read && read.p95Ms > config.readP95Ms) {
    failures.push(`Read p95 ${read.p95Ms}ms exceeded ${config.readP95Ms}ms.`);
  }
  const write = summary.byCategory.write;
  if (write && write.p95Ms > config.writeP95Ms) {
    failures.push(`Write p95 ${write.p95Ms}ms exceeded ${config.writeP95Ms}ms.`);
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('PASS: load thresholds satisfied.');
}

function printSummary(summary) {
  console.log('Load test summary');
  printSummaryLine('setup', summary.setup);
  printSummaryLine('load', summary.load);
  for (const [name, value] of Object.entries(summary.byCategory)) {
    printSummaryLine(`category:${name}`, value);
  }
  if (summary.errors.length > 0) {
    console.log('First load errors:');
    for (const error of summary.errors.slice(0, 10)) {
      console.log(
        `  ${error.label} ${error.status} ${error.durationMs}ms ${error.errorMessage}`,
      );
    }
  }
}

function printSummaryLine(label, data) {
  console.log(
    `  ${label}: total=${data.total} failed=${data.failed} error=${formatPct(data.errorRate)} p95=${data.p95Ms}ms p99=${data.p99Ms}ms`,
  );
}

function writeReport(summary) {
  const reportFile =
    config.reportFile ||
    resolve(process.cwd(), '..', '..', '.local-logs', `load-test-${config.runId}.json`);
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`Report written to ${reportFile}`);
}

function makePatientPayload(index) {
  return {
    nomeCompleto: `Paciente Load ${config.runId} ${index}`,
    cpf: makeCpf(index),
    rg: `${1000000 + index}`,
    dataNascimento: '1990-01-01',
    sexo: 'MASCULINO',
    estadoCivil: 'SOLTEIRO',
    profissao: 'Paciente de carga',
    contatoWhatsapp: `1199${String(1000000 + index).slice(0, 7)}`,
    contatoTelefone: `1133${String(1000000 + index).slice(0, 7)}`,
    contatoEmail: `loadtest.patient.${config.runId}.${index}@teste.com`,
    enderecoCep: '01001000',
    enderecoRua: 'Rua Load Test',
    enderecoNumero: String(index),
    enderecoComplemento: 'HML',
    enderecoBairro: 'Centro',
    enderecoCidade: 'Sao Paulo',
    enderecoUf: 'SP',
  };
}

function makeAnamnesePayload(pacienteId, index) {
  return {
    pacienteId,
    motivoBusca: 'SINTOMA_EXISTENTE',
    mecanismoLesao: 'SOBRECARGA',
    areasAfetadas: [{ regiao: 'joelho', lado: 'direito' }],
    intensidadeDor: 6 + (index % 3),
    descricaoSintomas: 'Dor no joelho direito em carga.',
    tempoProblema: '2 semanas',
    horaIntensifica: 'ao subir escadas',
    inicioProblema: 'GRADUAL',
    eventoEspecifico: 'sem trauma direto',
    fatorAlivio: 'repouso',
    fatoresPiora: 'agachar e subir escadas',
    problemaAnterior: false,
    quandoProblemaAnterior: '',
    tratamentosAnteriores: ['gelo', 'analgesico'],
  };
}

function makeMyAnamnesePayload(index) {
  return {
    motivoBusca: 'SINTOMA_EXISTENTE',
    mecanismoLesao: 'SOBRECARGA',
    areasAfetadas: [{ regiao: 'joelho', lado: 'direito' }],
    intensidadeDor: 6 + (index % 4),
    descricaoSintomas: 'Dor forte no joelho ha duas semanas.',
    tempoProblema: '2 semanas',
    horaIntensifica: 'fim do dia',
    inicioProblema: 'GRADUAL',
    eventoEspecifico: 'sem trauma direto',
    fatorAlivio: 'repouso e gelo',
    fatoresPiora: 'escadas, agachamento e caminhada prolongada',
    problemaAnterior: false,
    quandoProblemaAnterior: '',
    tratamentosAnteriores: ['repouso'],
  };
}

function makeEvolucaoPayload(pacienteId, index) {
  return {
    pacienteId,
    data: new Date().toISOString(),
    listagens: `Load test evolucao ${index}`,
    legCheck: 'sem alteracoes relevantes',
    ajustes: 'controle de carga e mobilidade',
    orientacoes: 'monitorar dor e evitar sobrecarga',
    observacoes: 'registro sintetico de carga',
  };
}

function makeActivityPayload(pacienteId, index) {
  return {
    pacienteId,
    titulo: `Plano load test ${index}`,
    descricao: 'Mobilidade leve e fortalecimento progressivo.',
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
    tempoMinutos: 12,
    melhoriaSessao: index % 7 === 0 ? 'MANTEVE' : 'MELHOROU',
    feedbackLivre: 'Check-in sintetico de carga.',
  };
}

function makeLaudoPayload(pacienteId, index) {
  return {
    pacienteId,
    motivoAvaliacao: 'Dor no joelho direito ha duas semanas',
    historicoClinico: 'Piora ao subir escadas e agachar, sem trauma direto.',
    achadosClinicos: 'Dor anterior no joelho direito e baixa tolerancia a carga.',
    diagnosticoFuncional: 'Sobrecarga femoropatelar provavel, pendente de validacao clinica.',
    objetivosCurtoPrazo: 'Reduzir dor e melhorar tolerancia a carga.',
    objetivosMedioPrazo: 'Retomar atividades diarias sem dor limitante.',
    frequenciaSemanal: 2,
    duracaoSemanas: 6,
    conclusao: `Laudo sintetico de carga ${index}.`,
    condutas: 'Educacao, controle de carga, mobilidade e fortalecimento progressivo.',
    planoTratamentoIA: 'Plano conservador com progressao baseada em resposta clinica.',
    observacoes: `Load test ${config.runId}`,
    criteriosAlta: 'Dor controlada e retorno funcional.',
  };
}

function minimalPdfBytes() {
  return new Uint8Array(
    Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
      'ascii',
    ),
  );
}

function virtualIpHeaders(vuId) {
  if (!config.useVirtualIps) return {};
  const id = Math.max(1, Number(vuId) || 1);
  const second = 64 + Math.floor(id / 65536);
  const third = Math.floor(id / 256) % 256;
  const fourth = (id % 254) + 1;
  const ip = `10.${second}.${third}.${fourth}`;
  return {
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
  };
}

function weighted(name, weight, run) {
  return { name, weight, run };
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
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

function assertSession(response, label) {
  if (!response?.token || !response?.refreshToken) {
    throw new Error(`${label} did not return token and refreshToken.`);
  }
}

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1),
  );
  return Math.round(sorted[index]);
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) continue;
    const withoutPrefix = arg.slice(2);
    const [key, ...rest] = withoutPrefix.split('=');
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
  if (envValue !== undefined) return envBool(envValue);
  return fallback;
}

function envBool(value) {
  return ['1', 'true', 'yes', 'sim'].includes(String(value || '').toLowerCase());
}

function safeRunId(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function makeCpf(index) {
  return String(91000000000 + Number(index)).slice(0, 11);
}

function shortPayload(value) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, 240);
}

function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function redactBaseUrl(value) {
  return String(value || '').replace(/\/\/([^/@]+)@/, '//***@');
}

function fatal(message) {
  throw new Error(message);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
