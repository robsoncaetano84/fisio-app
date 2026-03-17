import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddPremiumAnamneseAndEvolucao1773716400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
