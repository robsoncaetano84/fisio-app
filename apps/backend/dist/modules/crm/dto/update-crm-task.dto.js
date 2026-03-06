"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCrmTaskDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_crm_task_dto_1 = require("./create-crm-task.dto");
class UpdateCrmTaskDto extends (0, mapped_types_1.PartialType)(create_crm_task_dto_1.CreateCrmTaskDto) {
}
exports.UpdateCrmTaskDto = UpdateCrmTaskDto;
//# sourceMappingURL=update-crm-task.dto.js.map