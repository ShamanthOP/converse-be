import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import http from "http";
import schema from "./graphql/schema";
import resolvers from "./graphql/resolvers";
import { makeExecutableSchema } from "@graphql-tools/schema";
import * as dotenv from "dotenv";
import { getServerSession } from "./utils/functions";
import { GraphQLContext, SubscriptionContext } from "./utils/types";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const port = Number(process.env.PORT ?? 4000);

const executableSchema = makeExecutableSchema({ typeDefs: schema, resolvers });

const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
};

const prisma = new PrismaClient();
const pubsub = new PubSub();

const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql/subscriptions",
});

const serverCleanup = useServer(
    {
        schema: executableSchema,
        context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
            if (ctx.connectionParams && ctx.connectionParams.session) {
                const { session } = ctx.connectionParams;
                return { session, prisma, pubsub };
            }
            return { session: null, prisma, pubsub };
        },
    },
    wsServer
);

const server = new ApolloServer({
    schema: executableSchema,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});

const startServer = async () => {
    await server.start();
    app.use(
        "/graphql",
        cors<cors.CorsRequest>(corsOptions),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req, res }): Promise<GraphQLContext> => {
                console.log("Request: ", req);
                console.log("Request headers: ", req.headers);
                console.log("Request cookie: ", req.headers.cookie);
                const session = await getServerSession(req.headers.cookie);
                return { session, prisma, pubsub };
            },
        })
    );

    await new Promise<void>((resolve) =>
        httpServer.listen({ port: port }, resolve)
    );
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
};

startServer();

app.get("/", async (req, res) => {
    res.json({ hello: "message" });
});
