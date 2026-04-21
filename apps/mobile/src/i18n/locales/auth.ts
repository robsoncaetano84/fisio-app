// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// AUTH
// ==========================================
type TranslationMap = Record<string, string>;

export const ptAuth: TranslationMap = {
  "login.subtitle": "Avaliação, evolução e acompanhamento clínico",
  "login.recoveryEmailHint": "Informe o e-mail para recuperar",
  "login.recoveryEmailInfo": "Informe seu e-mail para recuperar a senha",
  "login.invalidEmailInfo": "Digite um e-mail válido",
  "login.recoverySent":
    "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação",
  "login.forgotPassword": "Esqueceu a senha?",
  "login.enter": "Entrar",
  "login.noAccount": "Não tem uma conta?",
  "login.signup": " Cadastre-se",
  "login.inviteSignup": "Cadastro por convite",
  "login.emailLabel": "E-mail",
  "login.emailPlaceholder": "seu@email.com",
  "login.passwordLabel": "Senha",
  "inviteSignup.title": "Cadastro do Paciente",
  "inviteSignup.subtitle": "Complete o cadastro para acessar sua área no app.",
  "inviteSignup.inviteTokenLabel": "Token do convite",
  "inviteSignup.fullNameLabel": "Nome completo",
  "inviteSignup.emailLabel": "E-mail",
  "inviteSignup.passwordLabel": "Senha",
  "inviteSignup.confirmPasswordLabel": "Confirmar senha",
  "inviteSignup.submit": "Concluir cadastro",
  "inviteSignup.invalidInvite": "Convite inválido",
  "inviteSignup.requiredName": "Nome obrigatório",
  "inviteSignup.requiredEmail": "E-mail obrigatório",
  "inviteSignup.requiredPassword": "Senha obrigatória",
  "inviteSignup.minPassword": "Senha deve ter ao menos 8 caracteres",
  "inviteSignup.confirmPasswordRequired": "Confirme a senha",
  "inviteSignup.passwordsMismatch": "As senhas não conferem",
  "inviteSignup.consentTitle": "Consentimentos",
  "inviteSignup.consentDescription":
    "Para concluir o cadastro, confirme os consentimentos obrigatórios.",
  "inviteSignup.consentTermsLabel":
    "Aceito os Termos de Uso para atendimento clínico (obrigatório)",
  "inviteSignup.consentPrivacyLabel":
    "Aceito a Política de Privacidade e uso de dados clínicos (obrigatório)",
  "inviteSignup.consentResearchLabel":
    "Autorizo uso anonimizado dos meus dados para pesquisa (opcional)",
  "inviteSignup.consentAiLabel":
    "Autorizo uso anonimizado para melhoria de IA clínica (opcional)",
  "inviteSignup.requiredTermsConsent": "Aceite os Termos de Uso",
  "inviteSignup.requiredPrivacyConsent":
    "Aceite a Política de Privacidade",
  "inviteSignup.successLinked": "Cadastro concluído e vínculo realizado",
  "inviteSignup.successPendingLink":
    "Cadastro concluído. Seu vínculo será finalizado pelo profissional.",
  "inviteSignup.noTokenTitle": "Cadastro do Paciente",
  "inviteSignup.noTokenSubtitle":
    "Você pode criar sua conta de paciente sem digitar token. Se abrir pelo link de convite, a vinculação com o profissional será feita automaticamente.",
  "inviteSignup.withTokenSubtitle":
    "Complete o cadastro para acessar sua área no app.",
  "inviteSignup.inviteDetected": "Convite detectado automaticamente",
  "inviteSignup.successNoInvite":
    "Cadastro de paciente concluído. Entre em contato com seu profissional para vincular seu atendimento.",
  "inviteSignup.acceptTitle": "Confirmar vínculo",
  "inviteSignup.acceptSubtitle":
    "Você entrou como {{email}}. Confirme o vínculo com este profissional.",
  "inviteSignup.acceptInvite": "Confirmar vínculo",
  "inviteSignup.acceptSuccess": "Vínculo confirmado com sucesso",
  "inviteSignup.existingAccountTitle": "Já tenho conta",
  "inviteSignup.existingAccountSubtitle":
    "Entre com sua conta de paciente para aceitar este convite.",
  "inviteSignup.loginToAccept": "Entrar para aceitar",
  "inviteSignup.nonPatientTitle": "Conta incompatível",
  "inviteSignup.nonPatientSubtitle":
    "Este convite só pode ser aceito com uma conta do tipo paciente.",
  "inviteSignup.switchAccount": "Trocar conta",
  "inviteSignup.loginMustBePatient":
    "Entre com uma conta de paciente para aceitar o convite",
  "auth.profileSelectTitle": "Como você quer se cadastrar?",
  "auth.profileSelectSubtitle":
    "Escolha o tipo de acesso para seguir com o cadastro correto.",
  "auth.profileProfessionalTitle": "Profissional",
  "auth.profileProfessionalSubtitle":
    "Cadastro de fisioterapeuta/profissional de saúde",
  "auth.profilePatientTitle": "Paciente",
  "auth.profilePatientSubtitle": "Cadastro de paciente",
  "auth.professionalSignupTitle": "Criar conta profissional",
  "auth.professionalSignupSubtitle":
    "Use este cadastro para fisioterapeuta/profissional. Pacientes devem usar o cadastro de paciente.",
  "auth.professionalSignupName": "Nome completo",
  "auth.professionalSignupEmail": "E-mail",
  "auth.professionalSignupPassword": "Senha",
  "auth.professionalSignupPasswordConfirm": "Confirmar senha",
  "auth.professionalSignupConselho": "Conselho profissional",
  "auth.professionalSignupConselhoOther": "Outro conselho",
  "auth.professionalSignupConselhoUf": "UF do conselho",
  "auth.professionalSignupRegistro": "Número de registro profissional",
  "auth.professionalSignupEspecialidade": "Especialidade (opcional)",
  "auth.professionalConsentTitle": "Consentimento profissional",
  "auth.professionalConsentLabel":
    "Declaro ciência da LGPD e autorizo o tratamento de dados e exames dos pacientes para assistência clínica no sistema (obrigatório)",
  "auth.professionalSignupSubmit": "Cadastrar e entrar",
  "auth.professionalSignupPatientCta": "Sou paciente (cadastro de paciente)",
  "auth.errorNameRequired": "Nome obrigatório",
  "auth.errorEmailRequired": "E-mail obrigatório",
  "auth.errorEmailInvalid": "Digite um e-mail válido",
  "auth.errorPasswordRequired": "Senha obrigatória",
  "auth.errorPasswordMin": "Senha deve ter ao menos 8 caracteres",
  "auth.errorPasswordConfirmRequired": "Confirme a senha",
  "auth.errorPasswordMismatch": "As senhas não conferem",
  "auth.errorConselhoRequired": "Conselho profissional obrigatório",
  "auth.errorConselhoUfRequired": "UF do conselho obrigatória",
  "auth.errorRegistroRequired": "Número de registro obrigatório",
  "auth.errorProfessionalConsentRequired":
    "Aceite o consentimento profissional LGPD",
  "auth.signupSuccess": "Cadastro realizado com sucesso",
};

export const enAuth: TranslationMap = {
  "login.subtitle": "Assessment, progress and clinical follow-up",
  "login.recoveryEmailHint": "Enter email for recovery",
  "login.recoveryEmailInfo": "Enter your email to recover password",
  "login.invalidEmailInfo": "Enter a valid email",
  "login.recoverySent":
    "If the email is registered, recovery instructions will be sent",
  "login.forgotPassword": "Forgot password?",
  "login.enter": "Sign in",
  "login.noAccount": "Don't have an account?",
  "login.signup": " Sign up",
  "login.inviteSignup": "Invite sign up",
  "login.emailLabel": "Email",
  "login.emailPlaceholder": "you@email.com",
  "login.passwordLabel": "Password",
  "inviteSignup.title": "Patient Sign Up",
  "inviteSignup.subtitle": "Complete sign up to access your area in the app.",
  "inviteSignup.inviteTokenLabel": "Invite token",
  "inviteSignup.fullNameLabel": "Full name",
  "inviteSignup.emailLabel": "Email",
  "inviteSignup.passwordLabel": "Password",
  "inviteSignup.confirmPasswordLabel": "Confirm password",
  "inviteSignup.submit": "Complete sign up",
  "inviteSignup.invalidInvite": "Invalid invite",
  "inviteSignup.requiredName": "Name is required",
  "inviteSignup.requiredEmail": "Email is required",
  "inviteSignup.requiredPassword": "Password is required",
  "inviteSignup.minPassword": "Password must be at least 8 characters",
  "inviteSignup.confirmPasswordRequired": "Confirm password",
  "inviteSignup.passwordsMismatch": "Passwords do not match",
  "inviteSignup.consentTitle": "Consents",
  "inviteSignup.consentDescription":
    "To finish registration, confirm mandatory consents.",
  "inviteSignup.consentTermsLabel":
    "I accept the Terms of Use for clinical care (required)",
  "inviteSignup.consentPrivacyLabel":
    "I accept the Privacy Policy and clinical data usage (required)",
  "inviteSignup.consentResearchLabel":
    "I allow anonymized use of my data for research (optional)",
  "inviteSignup.consentAiLabel":
    "I allow anonymized use for clinical AI improvement (optional)",
  "inviteSignup.requiredTermsConsent": "Accept Terms of Use",
  "inviteSignup.requiredPrivacyConsent": "Accept Privacy Policy",
  "inviteSignup.successLinked": "Sign up complete and link created",
  "inviteSignup.successPendingLink":
    "Sign up complete. Your link will be completed by the professional.",
  "inviteSignup.noTokenTitle": "Patient Sign Up",
  "inviteSignup.noTokenSubtitle":
    "You can create your patient account without typing a token. If you open through an invite link, linking to the professional will happen automatically.",
  "inviteSignup.withTokenSubtitle":
    "Complete sign up to access your area in the app.",
  "inviteSignup.inviteDetected": "Invite detected automatically",
  "inviteSignup.successNoInvite":
    "Patient account created. Contact your professional to link your treatment.",
  "inviteSignup.acceptTitle": "Confirm link",
  "inviteSignup.acceptSubtitle":
    "You are signed in as {{email}}. Confirm the link with this professional.",
  "inviteSignup.acceptInvite": "Confirm link",
  "inviteSignup.acceptSuccess": "Link confirmed successfully",
  "inviteSignup.existingAccountTitle": "I already have an account",
  "inviteSignup.existingAccountSubtitle":
    "Sign in with your patient account to accept this invite.",
  "inviteSignup.loginToAccept": "Sign in to accept",
  "inviteSignup.nonPatientTitle": "Incompatible account",
  "inviteSignup.nonPatientSubtitle":
    "This invite can only be accepted with a patient account.",
  "inviteSignup.switchAccount": "Switch account",
  "inviteSignup.loginMustBePatient":
    "Sign in with a patient account to accept the invite",
  "auth.profileSelectTitle": "How do you want to sign up?",
  "auth.profileSelectSubtitle":
    "Choose the access type to continue with the correct sign up flow.",
  "auth.profileProfessionalTitle": "Professional",
  "auth.profileProfessionalSubtitle":
    "Physical therapist/health professional sign up",
  "auth.profilePatientTitle": "Patient",
  "auth.profilePatientSubtitle": "Patient sign up",
  "auth.professionalSignupTitle": "Create professional account",
  "auth.professionalSignupSubtitle":
    "Use this sign up for physical therapists/professionals. Patients should use patient sign up.",
  "auth.professionalSignupName": "Full name",
  "auth.professionalSignupEmail": "Email",
  "auth.professionalSignupPassword": "Password",
  "auth.professionalSignupPasswordConfirm": "Confirm password",
  "auth.professionalSignupConselho": "Professional council",
  "auth.professionalSignupConselhoOther": "Other council",
  "auth.professionalSignupConselhoUf": "Council state",
  "auth.professionalSignupRegistro": "Professional registration number",
  "auth.professionalSignupEspecialidade": "Specialty (optional)",
  "auth.professionalConsentTitle": "Professional consent",
  "auth.professionalConsentLabel":
    "I acknowledge LGPD/data-protection rules and authorize processing of patient data and exams for clinical care in the system (required)",
  "auth.professionalSignupSubmit": "Sign up and enter",
  "auth.professionalSignupPatientCta": "I am a patient (patient sign up)",
  "auth.errorNameRequired": "Name is required",
  "auth.errorEmailRequired": "Email is required",
  "auth.errorEmailInvalid": "Enter a valid email",
  "auth.errorPasswordRequired": "Password is required",
  "auth.errorPasswordMin": "Password must be at least 8 characters",
  "auth.errorPasswordConfirmRequired": "Confirm password",
  "auth.errorPasswordMismatch": "Passwords do not match",
  "auth.errorConselhoRequired": "Professional council is required",
  "auth.errorConselhoUfRequired": "Council state is required",
  "auth.errorRegistroRequired": "Registration number is required",
  "auth.errorProfessionalConsentRequired":
    "Accept the professional LGPD consent",
  "auth.signupSuccess": "Sign up completed successfully",
};

export const esAuth: TranslationMap = {
  "login.subtitle": "Evaluación, evolución y seguimiento clínico",
  "login.recoveryEmailHint": "Ingresa el correo para recuperar",
  "login.recoveryEmailInfo": "Ingresa tu correo para recuperar la contraseña",
  "login.invalidEmailInfo": "Ingresa un correo válido",
  "login.recoverySent":
    "Si el correo está registrado, enviaremos las instrucciones de recuperación",
  "login.forgotPassword": "¿Olvidaste tu contraseña?",
  "login.enter": "Entrar",
  "login.noAccount": "¿No tienes una cuenta?",
  "login.signup": " Regístrate",
  "login.inviteSignup": "Registro por invitación",
  "login.emailLabel": "Correo",
  "login.emailPlaceholder": "tu@email.com",
  "login.passwordLabel": "Contraseña",
  "inviteSignup.title": "Registro del Paciente",
  "inviteSignup.subtitle":
    "Completa el registro para acceder a tu área en la app.",
  "inviteSignup.inviteTokenLabel": "Token de invitación",
  "inviteSignup.fullNameLabel": "Nombre completo",
  "inviteSignup.emailLabel": "Correo",
  "inviteSignup.passwordLabel": "Contraseña",
  "inviteSignup.confirmPasswordLabel": "Confirmar contraseña",
  "inviteSignup.submit": "Completar registro",
  "inviteSignup.invalidInvite": "Invitación inválida",
  "inviteSignup.requiredName": "Nombre obligatorio",
  "inviteSignup.requiredEmail": "Correo obligatorio",
  "inviteSignup.requiredPassword": "Contraseña obligatoria",
  "inviteSignup.minPassword": "La contraseña debe tener al menos 8 caracteres",
  "inviteSignup.confirmPasswordRequired": "Confirma la contraseña",
  "inviteSignup.passwordsMismatch": "Las contraseñas no coinciden",
  "inviteSignup.consentTitle": "Consentimientos",
  "inviteSignup.consentDescription":
    "Para completar el registro, confirma los consentimientos obligatorios.",
  "inviteSignup.consentTermsLabel":
    "Acepto los Términos de Uso para atención clínica (obligatorio)",
  "inviteSignup.consentPrivacyLabel":
    "Acepto la Política de Privacidad y uso de datos clínicos (obligatorio)",
  "inviteSignup.consentResearchLabel":
    "Autorizo uso anonimizado de mis datos para investigación (opcional)",
  "inviteSignup.consentAiLabel":
    "Autorizo uso anonimizado para mejora de IA clínica (opcional)",
  "inviteSignup.requiredTermsConsent": "Acepta los Términos de Uso",
  "inviteSignup.requiredPrivacyConsent":
    "Acepta la Política de Privacidad",
  "inviteSignup.successLinked": "Registro completado y vínculo realizado",
  "inviteSignup.successPendingLink":
    "Registro completado. Tu vínculo será finalizado por el profesional.",
  "inviteSignup.noTokenTitle": "Registro del Paciente",
  "inviteSignup.noTokenSubtitle":
    "Puedes crear tu cuenta de paciente sin escribir token. Si abres desde el enlace de invitación, la vinculación con el profesional se hará automáticamente.",
  "inviteSignup.withTokenSubtitle":
    "Completa el registro para acceder a tu área en la app.",
  "inviteSignup.inviteDetected": "Invitación detectada automáticamente",
  "inviteSignup.successNoInvite":
    "Cuenta de paciente creada. Contacta a tu profesional para vincular tu atención.",
  "inviteSignup.acceptTitle": "Confirmar vínculo",
  "inviteSignup.acceptSubtitle":
    "Entraste como {{email}}. Confirma el vínculo con este profesional.",
  "inviteSignup.acceptInvite": "Confirmar vínculo",
  "inviteSignup.acceptSuccess": "Vínculo confirmado con éxito",
  "inviteSignup.existingAccountTitle": "Ya tengo cuenta",
  "inviteSignup.existingAccountSubtitle":
    "Ingresa con tu cuenta de paciente para aceptar esta invitación.",
  "inviteSignup.loginToAccept": "Entrar para aceptar",
  "inviteSignup.nonPatientTitle": "Cuenta incompatible",
  "inviteSignup.nonPatientSubtitle":
    "Esta invitación solo puede aceptarse con una cuenta de paciente.",
  "inviteSignup.switchAccount": "Cambiar cuenta",
  "inviteSignup.loginMustBePatient":
    "Ingresa con una cuenta de paciente para aceptar la invitación",
  "auth.profileSelectTitle": "¿Cómo quieres registrarte?",
  "auth.profileSelectSubtitle":
    "Elige el tipo de acceso para continuar con el flujo correcto.",
  "auth.profileProfessionalTitle": "Profesional",
  "auth.profileProfessionalSubtitle":
    "Registro de fisioterapeuta/profesional de salud",
  "auth.profilePatientTitle": "Paciente",
  "auth.profilePatientSubtitle": "Registro de paciente",
  "auth.professionalSignupTitle": "Crear cuenta profesional",
  "auth.professionalSignupSubtitle":
    "Usa este registro para fisioterapeutas/profesionales. Los pacientes deben usar el registro de paciente.",
  "auth.professionalSignupName": "Nombre completo",
  "auth.professionalSignupEmail": "Correo",
  "auth.professionalSignupPassword": "Contraseña",
  "auth.professionalSignupPasswordConfirm": "Confirmar contraseña",
  "auth.professionalSignupConselho": "Consejo profesional",
  "auth.professionalSignupConselhoOther": "Otro consejo",
  "auth.professionalSignupConselhoUf": "Estado del consejo",
  "auth.professionalSignupRegistro": "Número de registro profesional",
  "auth.professionalSignupEspecialidade": "Especialidad (opcional)",
  "auth.professionalConsentTitle": "Consentimiento profesional",
  "auth.professionalConsentLabel":
    "Declaro conocimiento de la LGPD/protección de datos y autorizo el tratamiento de datos y exámenes de pacientes para atención clínica en el sistema (obligatorio)",
  "auth.professionalSignupSubmit": "Registrar e ingresar",
  "auth.professionalSignupPatientCta": "Soy paciente (registro de paciente)",
  "auth.errorNameRequired": "Nombre obligatorio",
  "auth.errorEmailRequired": "Correo obligatorio",
  "auth.errorEmailInvalid": "Ingresa un correo válido",
  "auth.errorPasswordRequired": "Contraseña obligatoria",
  "auth.errorPasswordMin": "La contraseña debe tener al menos 8 caracteres",
  "auth.errorPasswordConfirmRequired": "Confirma la contraseña",
  "auth.errorPasswordMismatch": "Las contraseñas no coinciden",
  "auth.errorConselhoRequired": "El consejo profesional es obligatorio",
  "auth.errorConselhoUfRequired": "El estado del consejo es obligatorio",
  "auth.errorRegistroRequired": "El número de registro es obligatorio",
  "auth.errorProfessionalConsentRequired":
    "Acepta el consentimiento profesional LGPD",
  "auth.signupSuccess": "Registro realizado con éxito",
};
