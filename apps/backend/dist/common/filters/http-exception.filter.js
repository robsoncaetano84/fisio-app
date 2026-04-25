"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalHttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const sentry_1 = require("../observability/sentry");
function redactSensitiveUrl(value) {
    return value.replace(/([?&](?:token|refreshToken|conviteToken|convite)=)[^&]*/gi, '$1[REDACTED]');
}
let GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = class GlobalHttpExceptionFilter {
    logger = new common_1.Logger(GlobalHttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request?.requestId ?? null;
        const path = redactSensitiveUrl(request?.originalUrl || request?.url || '');
        const method = request?.method || '';
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let error = 'Internal Server Error';
        let message = 'Erro interno do servidor';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (exceptionResponse &&
                typeof exceptionResponse === 'object') {
                const body = exceptionResponse;
                message = body.message ?? exception.message;
                error =
                    body.error ??
                        (status >= 500 ? 'Internal Server Error' : 'Bad Request');
            }
            else {
                message = exception.message;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        const isServerError = status >= 500;
        if (isServerError) {
            (0, sentry_1.captureException)(exception, {
                path,
                method,
                status,
                requestId,
                userId: request?.user?.id ?? null,
                userEmail: request?.user?.email ?? null,
                userRole: request?.user?.role ?? null,
            });
            this.logger.error(`${method} ${path} -> ${status} (requestId=${requestId ?? 'n/a'})`, exception instanceof Error ? exception.stack : undefined);
        }
        else {
            this.logger.warn(`${method} ${path} -> ${status} (requestId=${requestId ?? 'n/a'})`);
        }
        const payload = {
            statusCode: status,
            error,
            message,
            path,
            method,
            timestamp: new Date().toISOString(),
            requestId,
        };
        response.status(status).json(payload);
    }
};
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter;
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalHttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map