const conversationSchema = `
    scalar Date

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
        markConversationAsRead(userId: String!, conversationId: String!): Boolean
        deleteConversation(conversationId: String!): Boolean
    }

    type Query {
        conversations: [Conversation]
    }

    type Subscription {
        conversationCreated: Conversation
        conversationUpdated: Conversation
        conversationDeleted: ConversationDeletedPayload
    }

    type Participant {
        id: String
        user: User
        hasSeenLastMessage: Boolean
    }

    type Conversation {
        id: String
        latestMessage: Message
        participants: [Participant]
        createdAt: Date
        updatedAt: Date
    }

    type CreateConversationResponse {
        conversationId: String
    }

    type ConversationDeletedPayload {
        id: String
    }
`;

export default conversationSchema;
