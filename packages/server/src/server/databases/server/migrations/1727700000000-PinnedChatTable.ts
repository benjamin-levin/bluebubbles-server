import { Server } from "@server";
import { MigrationInterface, QueryRunner } from "typeorm";

export class PinnedChatTable1727700000000 implements MigrationInterface {
    name = "PinnedChatTable1727700000000";

    createPinnedChatTable = `
        CREATE TABLE IF NOT EXISTS "pinned_chat" (
            "chat_guid" text PRIMARY KEY NOT NULL,
            "pin_index" integer NOT NULL DEFAULT 0,
            "created" datetime NOT NULL DEFAULT (datetime('now'))
        );
    `;

    async up(queryRunner: QueryRunner): Promise<void> {
        Server().log(`Migration[${this.name}] Creating PinnedChat table...`, "debug");
        await queryRunner.query(this.createPinnedChatTable);
        Server().log(`Migration[${this.name}] Success!`, "debug");
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Dont do anything
    }
}
