import 'dotenv/config';
import { server } from './server/server';

const PORT = parseInt(process.env.WEBSERVER_PORT || '', 10) || 3000;

const start = async () => {
  try {
    await server.listen({ port: PORT });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
