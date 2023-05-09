const userSchema = `
    type SearchedUser {
        id: String,
        username: String
        image: String
    }

    type User {
        id: String
        name: String
        username: String
        email: String
        emailVerified: String
        image: String
    }

    type Query {
        searchUsers(username: String): [SearchedUser]
    }

    type CreateUsernameResponse {
        success: Boolean,
        error: String
    }

    type Mutation {
        createUsername(username: String): CreateUsernameResponse
    }
`;

export default userSchema;
