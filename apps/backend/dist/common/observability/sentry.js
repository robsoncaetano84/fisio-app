"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
const Sentry = __importStar(require("@sentry/node"));
let sentryInitialized = false;
function initSentry() {
    const dsn = process.env.SENTRY_DSN?.trim();
    if (!dsn || sentryInitialized)
        return;
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || undefined,
        tracesSampleRate: 0,
    });
    sentryInitialized = true;
}
function captureException(error, context) {
    if (!sentryInitialized)
        return;
    Sentry.withScope((scope) => {
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        Sentry.captureException(error);
    });
}
//# sourceMappingURL=sentry.js.map