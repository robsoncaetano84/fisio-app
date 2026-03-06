"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCrmInteractionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_crm_interaction_dto_1 = require("./create-crm-interaction.dto");
class UpdateCrmInteractionDto extends (0, mapped_types_1.PartialType)(create_crm_interaction_dto_1.CreateCrmInteractionDto) {
}
exports.UpdateCrmInteractionDto = UpdateCrmInteractionDto;
//# sourceMappingURL=update-crm-interaction.dto.js.map