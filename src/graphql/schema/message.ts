const messageSchema = `
    type Message {
        id: String
        sender: User
        body: String
        createdAt: Date
    }
`;

export default messageSchema;
