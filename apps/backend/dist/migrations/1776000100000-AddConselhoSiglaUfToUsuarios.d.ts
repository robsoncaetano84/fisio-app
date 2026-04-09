import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddConselhoSiglaUfToUsuarios1776000100000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
