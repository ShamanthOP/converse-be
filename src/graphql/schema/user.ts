const userSchema = `
    type User {
        id: String,
        username: String
    }

    type Query {
        searchUser(username: String): User
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
