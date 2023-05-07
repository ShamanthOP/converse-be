import { User } from "@prisma/client";
import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";
import { GraphQLError } from "graphql";

const userResolver = {
    Query: {
        searchUsers: async (
            _: any,
            args: { username: string },
            context: GraphQLContext
        ): Promise<Array<User>> => {
            const { username: searchedUsername } = args;

            const { session, prisma } = context;
            if (!session?.user) {
                throw new GraphQLError("Not authorized");
            }

            const {
                user: { username: currentUsername },
            } = session;

            try {
                const users = await prisma.user.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: currentUsername,
                            mode: "insensitive",
                        },
                    },
                });

                return users;
            } catch (e: any) {
                console.log("searchUsers Query Error", e);
                throw new GraphQLError(e?.message);
            }
        },
    },
    Mutation: {
        createUsername: async (
            _: any,
            args: { username: string },
            context: GraphQLContext
        ): Promise<CreateUsernameResponse> => {
            const { username } = args;
            const { session, prisma } = context;

            if (!session?.user) {
                return {
                    error: "Not Authorized",
                };
            }

            const userId = session.user.id;

            try {
                //Checking username is not taken
                const existingUser = await prisma.user.findUnique({
                    where: {
                        username,
                    },
                });

                if (existingUser) {
                    return {
                        error: "Username already taken. Try another",
                    };
                }

                //Update user
                await prisma.user.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        username,
                    },
                });

                return { success: true };
            } catch (error) {
                console.log("Error", error);
                if (error instanceof Error) {
                    return {
                        error: error?.message,
                    };
                } else {
                    return {
                        error: error as string,
                    };
                }
            }
        },
    },
};

export default userResolver;
