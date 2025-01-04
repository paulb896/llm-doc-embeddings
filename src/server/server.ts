import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import multipart from "@fastify/multipart";
import { aiSearchRoute } from './routes/aiSearchRoute';
import { dbSearchRoute } from './routes/dbSearchRoute';
import { indexDocsRoute } from './routes/indexDocsRoute';
import { documentUploadRoute } from './routes/documentUploadRoute';
import { getDocumentRoute } from './routes/getDocumentRoute';
import { getDocumentsRoute } from './routes/getDocumentsRoute';
import { deleteDocumentRoute } from './routes/deleteDocumentRoute';

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

server.register(cors);
server.register(multipart);
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
server.register(indexDocsRoute);
server.register(documentUploadRoute);
server.register(getDocumentRoute);
server.register(getDocumentsRoute);
server.register(deleteDocumentRoute);
server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});
