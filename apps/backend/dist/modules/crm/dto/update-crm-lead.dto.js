"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCrmLeadDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_crm_lead_dto_1 = require("./create-crm-lead.dto");
class UpdateCrmLeadDto extends (0, mapped_types_1.PartialType)(create_crm_lead_dto_1.CreateCrmLeadDto) {
}
exports.UpdateCrmLeadDto = UpdateCrmLeadDto;
//# sourceMappingURL=update-crm-lead.dto.js.map