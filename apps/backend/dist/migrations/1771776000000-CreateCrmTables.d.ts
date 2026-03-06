import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateCrmTables1771776000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
