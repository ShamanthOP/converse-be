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

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const port = Number(process.env.PORT ?? 4000);

const executableSchema = makeExecutableSchema({ typeDefs: schema, resolvers });

const server = new ApolloServer({
    schema: executableSchema,
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
};

const startServer = async () => {
    await server.start();
    app.use(
        "/graphql",
        cors<cors.CorsRequest>(corsOptions),
        express.json(),
        expressMiddleware(server)
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
