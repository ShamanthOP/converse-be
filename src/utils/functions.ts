import fetch from "cross-fetch";
import { ParticipantPopulated } from "./types";

export const getServerSession = async (cookie: string | undefined) => {
    if (!cookie) return null;
    const res = await fetch(
        process.env.CLIENT_AUTH_ORIGIN ??
            "http://localhost:3000/api/auth/session",
        {
            headers: { cookie: cookie },
        }
    );
    const session = await res.json();
    return session;
};

export const isUserInConversation = (
    participants: Array<ParticipantPopulated>,
    userId: string
): boolean => {
    return !!participants.find((participant) => participant.userId === userId);
};
