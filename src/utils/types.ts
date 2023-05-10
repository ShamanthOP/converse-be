import { ISODateString } from "next-auth";
import { Prisma, PrismaClient } from "@prisma/client";
import { conversationPopulated } from "../graphql/resolvers/conversation";
import { Context } from "graphql-ws/lib/server";
import { PubSub } from "graphql-subscriptions";
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
export type ConversationPopulated = Prisma.ConversationGetPayload<{
    include: typeof conversationPopulated;
}>;
