import "next-auth";

declare module "next-auth" {
    interface User {
        username: string;
        id: string;
        image: string;
    }

    interface Session {
        user: User;
    }
}
