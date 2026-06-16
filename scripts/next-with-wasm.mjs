import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);
const projectRoot = process.cwd();
const swcCachePath = path.join(projectRoot, ".next-swc-cache");
const wasmDir = path.join(projectRoot, "node_modules", "@next", "swc-wasm-nodejs");

if (!existsSync(swcCachePath)) {
  mkdirSync(swcCachePath, { recursive: true });
}

const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCli, command, ...args], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NEXT_SWC_PATH: process.env.NEXT_SWC_PATH ?? swcCachePath,
    NEXT_TEST_WASM_DIR: process.env.NEXT_TEST_WASM_DIR ?? wasmDir
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
