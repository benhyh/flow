---
inclusion: always
---

# Development Workflow Guidelines

## Documentation-First Approach

Before implementing any feature or fix:

1. Check `/docs/implementation.md` for current tasks and stage
2. Review `/docs/project_structure.md` for architectural patterns
3. Consult `/docs/ui_ux_doc.md` for design requirements
4. Search `/docs/bug_tracking.md` for known issues

## Task Execution Protocol

### Simple Tasks

- Implement directly following established patterns
- Verify against project structure guidelines
- Test functionality before marking complete

### Complex Tasks

- Break down into actionable subtasks
- Create implementation checklist
- Follow incremental development approach

## Code Quality Standards

### Architecture Compliance

- Follow established folder structure in `/docs/project_structure.md`
- Maintain consistent naming conventions
- Respect component hierarchy and separation of concerns

### UI/UX Implementation

- Reference design system specifications in `/docs/ui_ux_doc.md`
- Ensure responsive design patterns
- Maintain accessibility standards
- Follow established component patterns

### Error Handling

- Check existing solutions in `/docs/bug_tracking.md` first
- Document new issues with root cause analysis
- Include reproduction steps and resolution details
- Update bug tracking for future reference

## Completion Criteria

Mark tasks complete only when:

- ✅ Functionality works as specified
- ✅ Code follows project structure guidelines
- ✅ UI matches design specifications (if applicable)
- ✅ No errors or warnings remain
- ✅ Documentation updated if needed

## Critical Workflow Rules

- **Always** consult documentation before implementing
- **Always** follow established architectural patterns
- **Always** test functionality before completion
- **Never** skip project structure compliance checks
- **Never** implement UI without design system reference
- **Never** ignore existing bug tracking information

## Documentation Priority Order

1. `/docs/bug_tracking.md` - Known issues and solutions
2. `/docs/implementation.md` - Current tasks and requirements
3. `/docs/project_structure.md` - Architecture and patterns
4. `/docs/ui_ux_doc.md` - Design system and components
