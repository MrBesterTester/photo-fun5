# Cursor <-> Claude Code Compatibility Guide

This document shows how Cursor commands map to Claude Code usage for the Dylan Davis 50+ methodology.

## Command Mapping

### Specification Phase

**Cursor:**
```
/create-spec

Ask me one question at a time so we can develop a thorough, step-by-step spec for this idea...

Here's the idea: [your idea]
```

**Claude Code:**
```
I want to create a specification using the Dylan Davis method.
Reference @.claude/skills/create-spec.md and @docs/Dylan-Davis-50plus-method.md.

Ask me one question at a time to develop a thorough spec.

Here's the idea: [your idea]
```

### Blueprint Phase

**Cursor:**
```
/create-blueprint
```

**Claude Code:**
```
Create the blueprint from the specification.
Reference @.claude/skills/create-blueprint.md, @docs/SPECIFICATION.md, and @docs/Dylan-Davis-50plus-method.md.
```

### TODO Phase

**Cursor:**
```
/create-todo
```

**Claude Code:**
```
Create the TODO checklist from the blueprint.
Reference @.claude/skills/create-todo.md, @docs/BLUEPRINT.md, and @docs/Dylan-Davis-50plus-method.md.
```

### Development Steps

**Cursor:**
```
/start-step 1.1
```

**Claude Code:**
```
Start step 1.1
```

(Claude Code will automatically reference SPECIFICATION.md, BLUEPRINT.md, and TODO.md)

**Cursor:**
```
/continue-step 1.2
```

**Claude Code:**
```
Continue step 1.2
```

## Git Workflow

### Local Commit

**Cursor:**
```
/git-commit-local
```

**Claude Code:**
```
Review all changes and create a local commit. Exclude secrets.
```

### Push to Remote

**Cursor:**
```
Run gitleaks, then push to main.
```

**Claude Code:**
```
Run gitleaks detect --source . to scan for secrets, then push to main.
CI runs gitleaks + CodeQL as a second gate on every push.
```

## File References

### Cursor @ Syntax

Cursor uses `@` to reference files:
```
@docs/SPECIFICATION.md
@docs/BLUEPRINT.md
```

### Claude Code @ Syntax

Claude Code also uses `@` syntax:
```
@docs/SPECIFICATION.md
@docs/BLUEPRINT.md
@.claude/skills/create-spec.md
```

Both work the same way - the AI reads and uses the file content.

## Rules/Context

### Cursor Rules

Cursor loads rules from `.cursor/rules/*.mdc` or `.cursorrules`.

### Claude Code Rules

Claude Code uses:
- `.claude/RULES.md` (manual reference or auto-loaded)
- `CLAUDE.md` (project-level instructions)

Both systems read the same project conventions, just stored in different locations.

## Model Selection

### Cursor

In Cursor, you manually switch models in the UI based on the phase.

### Claude Code

In Claude Code, the assistant will remind you which model is recommended for each phase.

## Key Differences

1. **Slash commands**: Cursor has `/command` syntax; Claude Code uses natural language
2. **File loading**: Both use `@` syntax but Cursor may have special handling
3. **Model switching**: Manual in both, but Claude Code provides reminders
4. **Context**: Cursor rules auto-load; Claude Code uses CLAUDE.md and manual references

## Best Practice

When switching between tools:
1. **Commit your work** before switching
2. **Check TODO.md** to see what's completed
3. **Reference the three docs** (SPEC, BLUEPRINT, TODO) when starting fresh
4. **Follow the same conventions** regardless of tool
