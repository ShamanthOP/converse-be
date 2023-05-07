const userResolver = {
    Query: {
        searchUser: () => {},
    },
    Mutation: {
        createUsername: (_: any, args: { username: string }, context: any) => {
            const { username } = args;
            console.log("api", username);
        },
    },
};

export default userResolver;
