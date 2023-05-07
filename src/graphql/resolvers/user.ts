import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";

const userResolver = {
    Query: {
        searchUser: () => {},
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
