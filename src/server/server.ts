import 'dotenv/config';
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { aiSearchRoute } from './routes/aiSearchRoute';
import { dbSearchRoute } from './routes/dbSearchRoute';

const PORT = parseInt(process.env.WEBSERVER_PORT || '', 10) || 3000;
const HOST = process.env.WEBSERVER_HOST || 'localhost';

export const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      allErrors: true,
    },
  }
});

server.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'LLM Doc Embeddings AI Search API',
      description: 'API documentation for AI search',
      version: '1.0.0',
    },
    host: `${HOST}:${PORT}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    externalDocs: {
      url: 'https://github.com/paulb896/llm-doc-embeddings',
      description: 'Github for LLM Doc Embeddings'
    }
  },
});

server.register(aiSearchRoute);
server.register(dbSearchRoute);
server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});
