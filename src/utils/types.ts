import { ISODateString } from "next-auth";
import { PrismaClient } from "@prisma/client";

export interface GraphQLContext {
    session: Session | null;
    prisma: PrismaClient;
}

export interface Session {
    user?: User;
    expires: ISODateString;
}

export interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    image: string;
    emailVerified: boolean;
}

/*
 ** Users
 */
export interface CreateUsernameResponse {
    success?: boolean;
    error?: string;
}
