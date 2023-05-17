import { GraphQLError } from "graphql";
import {
    ConversationCreatedSubsriptionPayload,
    GraphQLContext,
} from "../../utils/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";

const conversationResolver = {
    Query: {
        conversations: async (_: any, __: any, context: GraphQLContext) => {
            const { session, prisma } = context;

            if (!session?.user) {
                console.log("Conversations query error");
                throw new GraphQLError("Not authorized");
            }
            const {
                user: { id: userId },
            } = session;
            try {
                const conversations = await prisma.conversation.findMany({
                    include: conversationPopulated,
                });
                return conversations.filter((conversation) =>
                    conversation.participants.find((p) => p.userId === userId)
                );
            } catch (e: any) {
                console.log("conversations Query Error", e);
                throw new GraphQLError(e?.message);
            }
        },
    },
    Mutation: {
        createConversation: async (
            _: any,
            args: { participantIds: Array<string> },
            context: GraphQLContext
        ): Promise<{ conversationId: string }> => {
            console.log("Create Conversation Mutation", args);
            const { participantIds } = args;
            const { session, prisma, pubsub } = context;

            if (!session?.user) {
                console.log("Conversations Mutation error");
                throw new GraphQLError("Not authorized");
            }
            const {
                user: { id: userId },
            } = session;
            try {
                const conversation = await prisma.conversation.create({
                    data: {
                        participants: {
                            createMany: {
                                data: participantIds.map((id) => ({
                                    userId: id,
                                    hasSeenLastMessage: id === userId,
                                })),
                            },
                        },
                    },
                    include: conversationPopulated,
                });

                pubsub.publish("CONVERSATION_CREATED", {
                    conversationCreated: conversation,
                });

                return {
                    conversationId: conversation.id,
                };
            } catch (e: any) {
                console.log("createConversation Mutation Error", e);
                throw new GraphQLError("Error creating conversation");
            }
        },
    },
    Subscription: {
        conversationCreated: {
            subscribe: withFilter(
                (_: any, __: any, context: GraphQLContext) => {
                    const { pubsub } = context;
                    return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
                },
                (
                    payload: ConversationCreatedSubsriptionPayload,
                    _: any,
                    context: GraphQLContext
                ) => {
                    const { session } = context;
                    const {
                        conversationCreated: { participants },
                    } = payload;

                    const userIsParticipant = !!participants.find(
                        (participant) =>
                            participant.userId === session?.user?.id
                    );
                    return userIsParticipant;
                }
            ),
        },
    },
};

export const participantPopulated =
    Prisma.validator<Prisma.ConversationParticipantInclude>()({
        user: {
            select: {
                id: true,
                username: true,
                image: true,
            },
        },
    });

export const conversationPopulated =
    Prisma.validator<Prisma.ConversationInclude>()({
        participants: {
            include: participantPopulated,
        },
        latestMessage: {
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        },
    });

export default conversationResolver;
