import fetch from "cross-fetch";

export const getServerSession = async (cookie: string | undefined) => {
    if (!cookie) return null;
    const res = await fetch("http://localhost:3000/api/auth/session", {
        headers: { cookie: cookie },
    });
    const session = await res.json();
    return session;
};
