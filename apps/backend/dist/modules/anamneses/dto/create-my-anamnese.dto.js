"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMyAnamneseDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_anamnese_dto_1 = require("./create-anamnese.dto");
class CreateMyAnamneseDto extends (0, mapped_types_1.OmitType)(create_anamnese_dto_1.CreateAnamneseDto, [
    'pacienteId',
]) {
}
exports.CreateMyAnamneseDto = CreateMyAnamneseDto;
//# sourceMappingURL=create-my-anamnese.dto.js.map