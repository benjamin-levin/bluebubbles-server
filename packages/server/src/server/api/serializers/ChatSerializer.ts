import { Server } from "@server";
import { ChatResponse } from "@server/types";
import { DEFAULT_CHAT_CONFIG, DEFAULT_HANDLE_CONFIG, DEFAULT_MESSAGE_CONFIG } from "./constants";
import type { ChatSerializerMutliParams, ChatSerializerSingleParams } from "./types";
import { MessageSerializer } from "./MessageSerializer";
import { HandleSerializer } from "./HandleSerializer";

export class ChatSerializer {
    static async serialize({
        chat,
        config = DEFAULT_CHAT_CONFIG,
        messageConfig = DEFAULT_MESSAGE_CONFIG,
        handleConfig = DEFAULT_HANDLE_CONFIG,
        isForNotification = false
    }: ChatSerializerSingleParams): Promise<ChatResponse> {
        return (
            await ChatSerializer.serializeList({
                chats: [chat],
                config: { ...DEFAULT_CHAT_CONFIG, ...config },
                messageConfig: { ...DEFAULT_MESSAGE_CONFIG, ...messageConfig },
                handleConfig: { ...DEFAULT_HANDLE_CONFIG, ...handleConfig },
                isForNotification
            })
        )[0];
    }

    static async serializeList({
        chats,
        config = DEFAULT_CHAT_CONFIG,
        messageConfig = DEFAULT_MESSAGE_CONFIG,
        handleConfig = DEFAULT_HANDLE_CONFIG,
        isForNotification = false
    }: ChatSerializerMutliParams): Promise<ChatResponse[]> {
        // Fetch the server-owned pin state once for the whole batch, rather than per-chat.
        const pinnedChats = await Server().repo.getPinnedChats();
        const pinIndexByGuid = new Map<string, number>(pinnedChats.map(p => [p.chatGuid, p.pinIndex]));

        return Promise.all(
            chats.map(
                async chat =>
                    await ChatSerializer.convert({
                        chat,
                        config: { ...DEFAULT_CHAT_CONFIG, ...config },
                        messageConfig: { ...DEFAULT_MESSAGE_CONFIG, ...messageConfig },
                        handleConfig: { ...DEFAULT_HANDLE_CONFIG, ...handleConfig },
                        isForNotification,
                        pinIndex: pinIndexByGuid.has(chat.guid) ? pinIndexByGuid.get(chat.guid) : null
                    })
            )
        );
    }

    private static async convert({
        chat,
        config = DEFAULT_CHAT_CONFIG,
        messageConfig = DEFAULT_MESSAGE_CONFIG,
        handleConfig = DEFAULT_HANDLE_CONFIG,
        isForNotification = false,
        pinIndex = null
    }: ChatSerializerSingleParams & { pinIndex?: number | null }): Promise<ChatResponse> {
        let output: ChatResponse = {
            originalROWID: chat.ROWID,
            guid: chat.guid,
            style: chat.style,
            chatIdentifier: chat.chatIdentifier,
            isArchived: chat.isArchived,
            displayName: chat.displayName,
            isPinned: pinIndex !== null,
            pinIndex
        };

        if (config.includeParticipants) {
            output.participants = await HandleSerializer.serializeList({
                handles: chat?.participants ?? [],
                config: {
                    ...handleConfig,
                    includeChats: false
                },
                messageConfig,
                chatConfig: config,
                isForNotification
            });
        }

        if (config.includeMessages) {
            output.messages = await MessageSerializer.serializeList({
                messages: chat?.messages ?? [],
                config: {
                    ...messageConfig,
                    includeChats: false
                },
                isForNotification
            });
        }

        if (!isForNotification) {
            output = {
                ...output,
                ...{
                    isFiltered: chat.isFiltered,
                    groupId: chat.groupId,
                    properties: chat.properties,
                    lastAddressedHandle: chat.lastAddressedHandle
                }
            };
        }

        return output;
    }
}
