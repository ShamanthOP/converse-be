import { GraphQLError } from "graphql";
import {
    GraphQLContext,
    MessaegSentSubsriptionPayload,
    MessagePopulated,
    SendMessageArguments,
} from "../../utils/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { isUserInConversation } from "../../utils/functions";
import { conversationPopulated } from "./conversation";

const messageResolver = {
    Query: {
        messages: async (
            _: any,
            args: { conversationId: string },
            context: GraphQLContext
        ): Promise<Array<MessagePopulated>> => {
            const { session, prisma } = context;
            const { conversationId } = args;

            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }
            const {
                user: { id: userId },
            } = session;

            const conversation = await prisma.conversation.findUnique({
                where: {
                    id: conversationId,
                },
                include: conversationPopulated,
            });

            if (!conversation) {
                throw new GraphQLError("Conversation Not Found");
            }
            const allowedToView = isUserInConversation(
                conversation.participants,
                userId
            );
            if (!allowedToView) {
                throw new GraphQLError("Not authorized");
            }

            try {
                const messages = prisma.message.findMany({
                    where: {
                        conversationId,
                    },
                    include: messagePopulated,
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                return messages;
            } catch (e: any) {
                console.log("messages Query Error", e);
                throw new GraphQLError(e?.message);
            }
        },
    },
    Mutation: {
        sendMessage: async (
            _: any,
            args: SendMessageArguments,
            context: GraphQLContext
        ): Promise<boolean> => {
            const { session, prisma, pubsub } = context;

            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }

            const {
                user: { id: userId },
            } = session;
            const { id: messageId, conversationId, body, senderId } = args;

            if (userId !== senderId) {
                throw new GraphQLError("Not authorized");
            }

            try {
                const newMessage = await prisma.message.create({
                    data: {
                        id: messageId,
                        body,
                        senderId,
                        conversationId,
                    },
                    include: messagePopulated,
                });
                const conversation = prisma.conversation.update({
                    where: {
                        id: conversationId,
                    },
                    data: {
                        latestMessageId: newMessage.id,
                        participants: {
                            update: {
                                where: {
                                    id: senderId,
                                },
                                data: {
                                    hasSeenLastMessage: true,
                                },
                            },
                            updateMany: {
                                where: {
                                    NOT: {
                                        userId: senderId,
                                    },
                                },
                                data: {
                                    hasSeenLastMessage: false,
                                },
                            },
                        },
                    },
                });

                pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: conversation,
                });
            } catch (e: any) {
                console.log("sendMessage Mutation Error", e);
                throw new GraphQLError(e?.message);
            }

            return true;
        },
    },
    Subscription: {
        messageSent: {
            subscribe: withFilter(
                (_: any, __: any, context: GraphQLContext) => {
                    const { pubsub } = context;
                    return pubsub.asyncIterator(["MESSAGE_SENT"]);
                },
                (
                    payload: MessaegSentSubsriptionPayload,
                    args: { conversationId: string }
                ) => {
                    return (
                        payload.messageSent.conversationId ===
                        args.conversationId
                    );
                }
            ),
        },
    },
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
    sender: {
        select: {
            id: true,
            username: true,
        },
    },
});

export default messageResolver;
