import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleCalendarUrlToInterview1700000019000 implements MigrationInterface {
    name = 'AddGoogleCalendarUrlToInterview1700000019000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interviews" ADD "google_calendar_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interviews" DROP COLUMN "google_calendar_url"`);
    }
}