import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const args = process.argv.slice(2);

const FILTER_TEXT = "[baseline-browser-mapping] The data in this module is over two months old.";

function pipeFiltered(stream, writer) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.includes(FILTER_TEXT)) {
        writer.write(`${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer && !buffer.includes(FILTER_TEXT)) {
      writer.write(buffer);
    }
  });
}

const child = spawn(process.execPath, [nextBin, ...args], {
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

pipeFiltered(child.stdout, process.stdout);
pipeFiltered(child.stderr, process.stderr);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
