# Claude Code Quick Start

Quick reference for using Claude Code with the Dylan Davis 50+ methodology on this project.

## Setup Complete

Your project is now configured for Claude Code:
- Skills created in `.claude/skills/`
- Commands created in `.claude/commands/`
- Rules documented in `.claude/RULES.md`
- Both Cursor and Claude Code can coexist

## Common Commands

### Specification Phase

```
Create a specification using the Dylan Davis method.
Reference @.claude/skills/create-spec.md

Here's the idea: [your idea]
```

### Blueprint Phase

```
Create the blueprint from the specification.
Reference @.claude/skills/create-blueprint.md @docs/SPECIFICATION.md
```

### TODO Phase

```
Create the TODO checklist from the blueprint.
Reference @.claude/skills/create-todo.md @docs/BLUEPRINT.md
```

### Development Steps

```
Start step 1.1
```

```
Continue step 2.3
```

### Git Workflow

**Local commit:**
```
Review the changes and create a local commit with a clear message.
Exclude .env, credentials, and other secrets.
```

**Push to remote:**
```
Run gitleaks detect --source . to scan for secrets, then push to main.
```

## Tips

1. **Start fresh between steps**: Clear context when moving to new implementation steps
2. **Reference the three docs**: Always work with SPEC, BLUEPRINT, and TODO in context
3. **Check TODO.md**: See current progress and what's next
4. **Model reminders**: I'll remind you which model is recommended for each phase
5. **Type check**: Run `npx tsc --noEmit` to validate changes

## File References

Use `@` syntax to reference files:
- `@docs/SPECIFICATION.md`
- `@docs/BLUEPRINT.md`
- `@docs/TODO.md`
- `@.claude/skills/start-step.md`

## Need Help?

- Full methodology: `@docs/Dylan-Davis-50plus-method.md`
- Project conventions: `@.claude/RULES.md`
- Tool comparison: `@.claude/CURSOR-COMPATIBILITY.md`
- This guide: `@.claude/QUICKSTART.md`
