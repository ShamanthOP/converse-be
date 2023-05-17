import userResolver from "./user";
import conversationResolver from "./conversation";
import merge from "lodash.merge";
import messageResolver from "./message";
import scalarResolver from "./scalar";

const reslovers = merge(
    {},
    userResolver,
    conversationResolver,
    messageResolver,
    scalarResolver
);

export default reslovers;
