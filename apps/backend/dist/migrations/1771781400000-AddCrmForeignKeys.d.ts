import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddCrmForeignKeys1771781400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
