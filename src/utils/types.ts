import { ISODateString } from "next-auth";
import { Prisma, PrismaClient } from "@prisma/client";
import {
    conversationPopulated,
    participantPopulated,
} from "../graphql/resolvers/conversation";
import { Context } from "graphql-ws/lib/server";
import { PubSub } from "graphql-subscriptions";
import { messagePopulated } from "../graphql/resolvers/message";
/*
 ** Server configuration
 */
export interface SubscriptionContext extends Context {
    connectionParams: {
        session?: Session;
    };
}

export interface GraphQLContext {
    session: Session | null;
    prisma: PrismaClient;
    pubsub: PubSub;
}

export interface Session {
    user?: User;
    expires: ISODateString;
}

/*
 ** Users
 */
export interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    image: string;
    emailVerified: boolean;
}

export interface CreateUsernameResponse {
    success?: boolean;
    error?: string;
}

/*
 ** Conversations
 */
export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
    include: typeof participantPopulated;
}>;

export type ConversationPopulated = Prisma.ConversationGetPayload<{
    include: typeof conversationPopulated;
}>;

export interface ConversationCreatedSubsriptionPayload {
    conversationCreated: ConversationPopulated;
}

export interface ConversationUpdatedSubsriptionPayload {
    conversationUpdated: {
        conversation: ConversationPopulated;
        addedUserIds: Array<string>;
        removedUserIds: Array<string>;
    };
}

export interface ConversationDeletedPayload {
    id: string;
    participants: Array<ParticipantPopulated>;
}

export interface ConversationDeletedSubsriptionPayload {
    conversationDeleted: ConversationDeletedPayload;
}

/*
 ** Messages
 */
export interface SendMessageArguments {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
}

export type MessagePopulated = Prisma.MessageGetPayload<{
    include: typeof messagePopulated;
}>;

export interface MessageSentSubsriptionPayload {
    messageSent: MessagePopulated;
}
