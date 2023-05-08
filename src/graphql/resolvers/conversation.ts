import { GraphQLContext } from "../../utils/types";

const conversationResolver = {
    Mutation: {
        createConversation: async (
            _: any,
            args: { participantIds: Array<string> },
            context: GraphQLContext
        ) => {
            console.log("Craete Conversation Mutation", args);
        },
    },
};

export default conversationResolver;
