"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let LockoutService = class LockoutService {
    configService;
    inMemory = new Map();
    redis;
    useRedis;
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL');
        if (redisUrl) {
            this.redis = new ioredis_1.default(redisUrl);
            this.useRedis = true;
        }
        else {
            this.useRedis = false;
        }
    }
    getKey(email) {
        return `lockout:${email.toLowerCase()}`;
    }
    lockoutWindowMs() {
        return ((this.configService.get('LOCKOUT_WINDOW_MIN') ?? 15) * 60_000);
    }
    lockoutDurationMs() {
        return ((this.configService.get('LOCKOUT_DURATION_MIN') ?? 30) * 60_000);
    }
    maxAttempts() {
        return this.configService.get('LOCKOUT_MAX_ATTEMPTS') ?? 5;
    }
    async getRecord(email) {
        if (this.useRedis && this.redis) {
            const raw = await this.redis.get(this.getKey(email));
            return raw ? JSON.parse(raw) : null;
        }
        return this.inMemory.get(email) ?? null;
    }
    async setRecord(email, record) {
        if (this.useRedis && this.redis) {
            const ttlMs = Math.max(this.lockoutWindowMs(), this.lockoutDurationMs());
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            await this.redis.set(this.getKey(email), JSON.stringify(record), 'EX', ttlSeconds);
            return;
        }
        this.inMemory.set(email, record);
    }
    async reset(email) {
        if (this.useRedis && this.redis) {
            await this.redis.del(this.getKey(email));
            return;
        }
        this.inMemory.delete(email);
    }
    async isLocked(email) {
        const record = await this.getRecord(email);
        if (!record?.lockedUntil) {
            return false;
        }
        return record.lockedUntil > Date.now();
    }
    async registerFailure(email) {
        const now = Date.now();
        const windowMs = this.lockoutWindowMs();
        const durationMs = this.lockoutDurationMs();
        const maxAttempts = this.maxAttempts();
        const current = (await this.getRecord(email)) ?? {
            count: 0,
            firstAttemptAt: now,
        };
        const withinWindow = now - current.firstAttemptAt <= windowMs;
        const nextCount = withinWindow ? current.count + 1 : 1;
        const nextRecord = {
            count: nextCount,
            firstAttemptAt: withinWindow ? current.firstAttemptAt : now,
            lockedUntil: nextCount >= maxAttempts ? now + durationMs : undefined,
        };
        await this.setRecord(email, nextRecord);
        return nextRecord;
    }
};
exports.LockoutService = LockoutService;
exports.LockoutService = LockoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LockoutService);
//# sourceMappingURL=lockout.service.js.map