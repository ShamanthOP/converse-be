import { GraphQLError } from "graphql";
import {
    ConversationCreatedSubsriptionPayload,
    ConversationDeletedSubsriptionPayload,
    ConversationUpdatedSubsriptionPayload,
    GraphQLContext,
} from "../../utils/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { isUserInConversation } from "../../utils/functions";

const conversationResolver = {
    Query: {
        conversations: async (_: any, __: any, context: GraphQLContext) => {
            const { session, prisma } = context;

            if (!session?.user) {
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

                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: { conversation },
                });

                return {
                    conversationId: conversation.id,
                };
            } catch (e: any) {
                console.log("createConversation Mutation Error", e);
                throw new GraphQLError("Error creating conversation");
            }
        },
        markConversationAsRead: async (
            _: any,
            args: { userId: string; conversationId: string },
            context: GraphQLContext
        ): Promise<boolean> => {
            const { session, prisma } = context;
            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }

            const { userId, conversationId } = args;

            try {
                const participant =
                    await prisma.conversationParticipant.findFirst({
                        where: {
                            userId,
                            conversationId,
                        },
                    });
                if (!participant) {
                    throw new GraphQLError("Participant entity not found");
                }
                await prisma.conversationParticipant.update({
                    where: {
                        id: participant.id,
                    },
                    data: {
                        hasSeenLastMessage: true,
                    },
                });
            } catch (e: any) {
                console.log("markConversationAsRead Mutation Error", e);
                throw new GraphQLError("Error marking conversation as read");
            }
            return true;
        },
        deleteConversation: async (
            _: any,
            args: { conversationId: string },
            context: GraphQLContext
        ): Promise<boolean> => {
            const { session, prisma, pubsub } = context;
            const { conversationId } = args;
            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }

            try {
                const conversation = await prisma.conversation.findFirst({
                    where: {
                        id: conversationId,
                    },
                    include: conversationPopulated,
                });
                const participants = conversation?.participants;
                const [deletedConversation] = await prisma.$transaction([
                    prisma.conversation.delete({
                        where: {
                            id: conversationId,
                        },
                    }),
                    prisma.conversationParticipant.deleteMany({
                        where: {
                            conversationId,
                        },
                    }),
                    prisma.message.deleteMany({
                        where: {
                            conversationId,
                        },
                    }),
                ]);

                pubsub.publish("CONVERSATION_DELETED", {
                    conversationDeleted: { id: conversationId, participants },
                });
            } catch (e: any) {
                console.log("deleteConversation Mutation Error", e);
                throw new GraphQLError("Error deleting conversation");
            }

            return true;
        },
        updateParticipants: async (
            _: any,
            args: { conversationId: string; participantIds: Array<string> },
            context: GraphQLContext
        ): Promise<boolean> => {
            const { session, prisma, pubsub } = context;
            const { conversationId, participantIds } = args;
            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }

            const {
                user: { id: userId },
            } = session;

            try {
                const participants =
                    await prisma.conversationParticipant.findMany({
                        where: {
                            conversationId,
                        },
                    });

                const existingPartcipants = participants.map((p) => p.userId);

                const participantsToDelete = existingPartcipants.filter(
                    (id) => !participantIds.includes(id)
                );
                const participantsToAdd = participantIds.filter(
                    (id) => !existingPartcipants.includes(id)
                );

                const transactionStatements = [
                    prisma.conversation.update({
                        where: {
                            id: conversationId,
                        },
                        data: {
                            participants: {
                                deleteMany: {
                                    userId: {
                                        in: participantsToDelete,
                                    },
                                    conversationId,
                                },
                            },
                        },
                        include: conversationPopulated,
                    }),
                ];

                if (participantsToAdd.length) {
                    transactionStatements.push(
                        prisma.conversation.update({
                            where: {
                                id: conversationId,
                            },
                            data: {
                                participants: {
                                    createMany: {
                                        data: participantsToAdd.map((id) => ({
                                            userId: id,
                                            hasSeenLastMessage: true,
                                        })),
                                    },
                                },
                            },
                            include: conversationPopulated,
                        })
                    );
                }

                const [deleteUpdate, addUpdate] = await prisma.$transaction(
                    transactionStatements
                );

                console.log("DeleteUpdate", deleteUpdate);
                console.log("Addupdate", addUpdate);

                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: {
                        conversation: addUpdate || deleteUpdate,
                        addedUserIds: participantsToAdd,
                        removedUserIds: participantsToDelete,
                    },
                });
            } catch (e: any) {
                console.log("updatePartcicpants Mutation Error", e);
                throw new GraphQLError("Error updating conversation");
            }

            return true;
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

                    if (!session?.user) {
                        throw new GraphQLError("Not authorized");
                    }

                    const userIsParticipant = isUserInConversation(
                        participants,
                        session?.user?.id
                    );
                    return userIsParticipant;
                }
            ),
        },
        conversationUpdated: {
            subscribe: withFilter(
                (_: any, __: any, context: GraphQLContext) => {
                    const { pubsub } = context;
                    return pubsub.asyncIterator("CONVERSATION_UPDATED");
                },
                (
                    payload: ConversationUpdatedSubsriptionPayload,
                    _: any,
                    context: GraphQLContext
                ) => {
                    const { session } = context;
                    if (!session?.user) {
                        throw new GraphQLError("Not authorized");
                    }
                    const {
                        user: { id: userId },
                    } = session;
                    const {
                        conversationUpdated: {
                            conversation: { participants },
                            addedUserIds,
                            removedUserIds,
                        },
                    } = payload;

                    const userIsParticipant = isUserInConversation(
                        participants,
                        session.user.id
                    );
                    const userSentLastMessage =
                        payload.conversationUpdated.conversation.latestMessage
                            ?.senderId === userId;
                    const userIsBeingRemoved =
                        removedUserIds &&
                        !!removedUserIds.find((id) => id === userId);

                    return (
                        userSentLastMessage ||
                        userIsBeingRemoved ||
                        (userIsParticipant && !userSentLastMessage)
                    );
                }
            ),
        },
        conversationDeleted: {
            subscribe: withFilter(
                (_: any, __: any, context: GraphQLContext) => {
                    const { pubsub } = context;
                    return pubsub.asyncIterator("CONVERSATION_DELETED");
                },
                async (
                    payload: ConversationDeletedSubsriptionPayload,
                    _: any,
                    context: GraphQLContext
                ): Promise<boolean> => {
                    const { session } = context;
                    if (!session?.user) {
                        throw new GraphQLError("Not authorized");
                    }

                    const { id: userId } = session.user;
                    const {
                        conversationDeleted: { participants },
                    } = payload;
                    return isUserInConversation(participants!, userId);
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
