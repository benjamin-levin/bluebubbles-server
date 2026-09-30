import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "pinned_chat" })
export class PinnedChat {
    @PrimaryColumn("text", { name: "chat_guid" })
    chatGuid: string;

    @Column("integer", { name: "pin_index" })
    pinIndex: number;

    @CreateDateColumn({ name: "created" })
    created: Date;
}
