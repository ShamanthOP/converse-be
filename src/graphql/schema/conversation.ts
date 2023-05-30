const conversationSchema = `
    scalar Date
    
    type Query {
        conversations: [Conversation]
    }

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
        markConversationAsRead(userId: String!, conversationId: String!): Boolean
        deleteConversation(conversationId: String!): Boolean
        updateParticipants(conversationId: String!, participantIds: [String]!): Boolean
    }

    type Subscription {
        conversationCreated: Conversation
        conversationUpdated: ConversationUpdatedResponse
        conversationDeleted: ConversationDeletedResponse
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

    type ConversationDeletedResponse {
        id: String
        participants: [Participant]
    }

    type ConversationUpdatedResponse {
        conversation: Conversation
        addedUserIds: [String]
        removedUserIds: [String]
    }
`;

export default conversationSchema;
