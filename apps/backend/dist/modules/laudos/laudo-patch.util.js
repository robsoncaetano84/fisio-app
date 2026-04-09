"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePartialUpdate = sanitizePartialUpdate;
function sanitizePartialUpdate(payload) {
    const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
    return Object.fromEntries(entries);
}
//# sourceMappingURL=laudo-patch.util.js.map