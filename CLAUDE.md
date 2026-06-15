@AGENTS.md

# Rules: Agent Instructions & Commands

This file defines the behavior, command usage, and project-specific constraints for the AI Agent.

## Environment & Commands

- **Do NOT run `git` commands**: Any version control operations must be avoided or handled by the user.
- **Do NOT run `bun run build`**: Avoid triggering full builds using Bun.
- **Use `tree`**: Always use the `tree` command to visualize the directory structure when exploring folders.
- **Use `diff` concept / edits**: Use fine-grained file modification tools (`replace_file_content` / `multi_replace_file_content`) to apply edits rather than overwriting full files.
- **Use RTK (Rust Token Killer)**: For commands run on the system, make sure the `rtk` CLI prefix is utilized where appropriate or rely on the hook-based proxy configuration to optimize token consumption.




## Next.js (Modern / Breaking Changes)

- This project uses a version of Next.js with breaking changes (APIs, conventions, and file structures may differ from standard training data).
- Always consult the documentation in `node_modules/next/dist/docs/` before writing Next.js code.
- Carefully observe and follow deprecation notices.

## Context & Documentation

- **Use MCP `context7`**: Leverage the `context7` MCP server (`resolve-library-id`, `query-docs`) to query and access up-to-date library documentation.

## Memory Management (mem0 Plugin)

- **Active Memory Storage**: Use the `remember` skill to store crucial user preferences, architecture decisions, database patterns, and project conventions whenever they are established or modified.
- **Context Loading**: Always leverage `context-loader` at the start of a task or context shift to retrieve relevant historical decisions and project contexts.
- **Memory Maintenance**: Keep memories clean and organized using the `tour`, `peek`, `pin`, and `forget` skills to ensure high-quality, relevant context retrieval.

