import fetch from "cross-fetch";
import { ParticipantPopulated } from "./types";

export const getServerSession = async (cookie: string | undefined) => {
    if (!cookie) return null;
    console.log("Client origin", process.env.CLIENT_ORIGIN);
    const res = await fetch(
        process.env.CLIENT_AUTH_ORIGIN ??
            "http://localhost:3000/api/auth/session",
        {
            headers: { cookie: cookie },
        }
    );
    const session = await res.json();
    console.log("Response and session", res, session);
    return session;
};

export const isUserInConversation = (
    participants: Array<ParticipantPopulated>,
    userId: string
): boolean => {
    return !!participants.find((participant) => participant.userId === userId);
};
