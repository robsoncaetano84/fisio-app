import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMelhoriaSessaoToAtividadeCheckin1776500000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
