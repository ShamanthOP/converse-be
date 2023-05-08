import userResolver from "./user";
import conversationResolver from "./conversation";
import merge from "lodash.merge";

const reslovers = merge({}, userResolver, conversationResolver);

export default reslovers;
