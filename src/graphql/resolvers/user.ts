const userResolver = {
    Query: {
        searchUser: () => {},
    },
    Mutation: {
        createUsername: (_: any, args: { username: string }, context: any) => {
            const { username } = args;
            console.log("api", username, context);
        },
    },
};

export default userResolver;
