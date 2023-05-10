const conversationSchema = `
    scalar Date

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
    }

    type Query {
        conversations: [Conversation]
    }

    type Subscription {
        conversationCreated: Conversation
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
`;

export default conversationSchema;
