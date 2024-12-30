import { server } from "./server/server";
import { writeFileSync } from "fs";

server.ready(() => {
  const yaml = server.swagger({ yaml: true });
  writeFileSync('./swagger.yml', yaml);
});
