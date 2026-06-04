import { spawn } from "node:child_process";

async function run() {
  const child = spawn("bunx", ["drizzle-kit", "push"], {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });

  child.stdout.on("data", (data) => {
    const output = data.toString();
    process.stdout.write(output);

    if (output.includes("Yes, I want to execute all statements")) {
      console.log("\n[Script] Sending arrow down and enter...");
      child.stdin.write("\u001b[B");
      setTimeout(() => {
        child.stdin.write("\n");
      }, 500);
    }
  });

  child.on("close", (code) => {
    console.log(`\n[Script] Child process exited with code ${code}`);
    process.exit(code || 0);
  });
}

run().catch(console.error);
