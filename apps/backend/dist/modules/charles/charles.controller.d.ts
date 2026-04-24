import { Usuario } from '../usuarios/entities/usuario.entity';
import { CharlesEvolucaoSoapSuggestionResponse, CharlesExameFisicoDorSuggestionResponse, CharlesNextActionResponse, CharlesService } from './charles.service';
import { GetCharlesNextActionDto } from './dto/get-charles-next-action.dto';
export declare class CharlesController {
    private readonly charlesService;
    constructor(charlesService: CharlesService);
    getNextAction(usuario: Usuario, params: GetCharlesNextActionDto): Promise<CharlesNextActionResponse>;
    getExameFisicoDorSuggestion(usuario: Usuario, params: GetCharlesNextActionDto): Promise<CharlesExameFisicoDorSuggestionResponse>;
    getEvolucaoSoapSuggestion(usuario: Usuario, params: GetCharlesNextActionDto): Promise<CharlesEvolucaoSoapSuggestionResponse>;
}
