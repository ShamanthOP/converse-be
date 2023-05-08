import { GraphQLError } from "graphql";
import { GraphQLContext } from "../../utils/types";
import { Prisma } from "@prisma/client";

const conversationResolver = {
    Mutation: {
        createConversation: async (
            _: any,
            args: { participantIds: Array<string> },
            context: GraphQLContext
        ): Promise<{ conversationId: string }> => {
            console.log("Create Conversation Mutation", args);
            const { participantIds } = args;
            const { session, prisma } = context;

            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }
            const {
                user: { id: userId },
            } = session;
            try {
                const conversations = await prisma.conversation.create({
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
                return {
                    conversationId: conversations.id,
                };
            } catch (e: any) {
                console.log("createConversation Mutation Error", e);
                throw new GraphQLError("Error creating conversation");
            }
        },
    },
};

export const participantPopulated =
    Prisma.validator<Prisma.ConversationParticipantInclude>()({
        user: {
            select: {
                id: true,
                username: true,
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
