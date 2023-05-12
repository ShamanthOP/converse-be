import userResolver from "./user";
import conversationResolver from "./conversation";
import merge from "lodash.merge";
import messageResolver from "./message";

const reslovers = merge(
    {},
    userResolver,
    conversationResolver,
    messageResolver
);

export default reslovers;
