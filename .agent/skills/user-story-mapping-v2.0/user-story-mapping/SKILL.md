---
name: user-story-mapping
description: "Create user story maps to visualize user journeys, organize backlog items, and prioritize features. Use when building product roadmaps, planning releases, organizing user stories, or creating shared understanding of user workflows. Supports team collaboration workshops and backlog refinement."
version: 2.0
author: improved-version
tags: [product-management, agile, user-stories, backlog, prioritization, roadmapping]
triggers:
  - "user story map"
  - "story mapping"
  - "user journey map"
  - "create story map"
  - "organize user stories"
  - "product roadmap"
  - "backlog prioritization"
  - "release planning"
---

# User Story Mapping

## What is User Story Mapping?

User Story Mapping is a collaborative practice that organizes user stories into a meaningful model that helps teams understand the user's journey through a product. Created by Jeff Patton, it provides a visual representation of the user experience and helps teams prioritize work effectively.

The technique transforms a flat backlog into a two-dimensional map where:
- **Horizontal axis**: User activities and steps (the user journey)
- **Vertical axis**: Priority and importance (MVP to future enhancements)

## When to Use This Skill

Use this skill when you need to:
- Create a shared understanding of the user journey
- Organize and prioritize a large number of user stories
- Plan releases with clear MVP boundaries
- Visualize the entire product scope
- Facilitate team workshops for backlog refinement
- Communicate product vision to stakeholders
- Identify gaps in the user experience

## Example Prompts

**Example 1: New Product Story Map**
```
Create a user story map for an e-commerce mobile app. The target users are 
online shoppers who want to browse, compare, and purchase products quickly. 
Focus on the core shopping experience from discovery to checkout.
```

**Example 2: Existing Product Enhancement**
```
We have a project management tool. Create a user story map for adding 
collaboration features (comments, mentions, file sharing). Our users are 
remote teams who need real-time communication.
```

**Example 3: Backlog Organization**
```
Help me organize this backlog of 50 user stories into a story map. 
The product is a fitness tracking app. Here are the stories: [paste stories]
```

**Example 4: Release Planning**
```
Create a story map for a food delivery app MVP and identify what should be 
in the first release vs. future iterations. Focus on customer experience.
```

## Output Format

When creating a user story map, the output will follow this structure:

```
## User Personas
- Primary Persona: [Name, role, goals]
- Secondary Personas: [If applicable]

## Narrative Flow (Horizontal Axis)

### Activity 1: [Name]
**User Goal**: [What the user wants to achieve]

| Step | User Story | Priority | Release |
|------|------------|----------|---------|
| 1.1  | As a... I want to... So that... | Must Have | MVP |
| 1.2  | As a... I want to... So that... | Should Have | v1.1 |

### Activity 2: [Name]
...

## MVP Slice
Stories included in MVP: [List]
Estimated effort: [If known]

## Future Releases
- Release 2: [Features/Stories]
- Release 3: [Features/Stories]

## Gaps & Questions
- [Identified missing stories]
- [Open questions for the team]
```

## Step-by-Step Guide

### Step 1: Define User Personas

Start by identifying who will use the product. Create clear persona definitions:

- **Primary Persona**: The main user whose needs drive the product
- **Secondary Personas**: Other users with different needs
- **Negative Personas**: Users you explicitly don't target

For each persona, document:
- Name and role
- Goals and motivations
- Pain points and frustrations
- Context of use

**Example**:
```
Persona: Sarah, Busy Parent
- Goals: Quick meal planning, healthy options for kids
- Pain Points: Limited time, picky eaters
- Context: Uses phone while cooking, needs voice commands
```

### Step 2: Map the Backbone

Create the high-level structure of the user journey:

1. **Identify Activities** (broad goals)
   - What major things do users want to accomplish?
   - Use verb phrases: "Manage Account", "Purchase Products"
   - Limit to 5-9 major activities for clarity

2. **Define Steps** (specific tasks under each activity)
   - Break each activity into sequential steps
   - Think from the user's perspective
   - Include alternative paths where relevant

**Template for Backbone**:
```
Activity: [Name]
├── Step 1: [First action]
├── Step 2: [Second action]
├── Step 3: [Third action]
└── Step 4: [Final action]
```

### Step 3: Generate User Stories

For each step in the backbone, write user stories:

**Format**: "As a [persona], I want to [action], so that [benefit]"

**Guidelines**:
- Keep stories small and testable
- Focus on user value, not implementation
- Include acceptance criteria when helpful
- Write from the persona's perspective

**Story Writing Checklist**:
- [ ] Uses the standard format
- [ ] Has clear user value
- [ ] Is testable/verifiable
- [ ] Fits in a single sprint (if using Agile)
- [ ] Has acceptance criteria (for complex stories)

### Step 4: Organize by Priority

Arrange stories vertically by importance:

**Priority Levels**:
1. **Must Have** (MVP) - Critical for basic functionality
2. **Should Have** - Important but not critical
3. **Could Have** - Nice to have if time permits
4. **Won't Have** - Explicitly out of scope for now

**Priority Questions**:
- Does the user need this to achieve their goal?
- Is there a workaround without this feature?
- What's the impact if this is missing?
- How often will users need this?

### Step 5: Slice the Releases

Draw horizontal lines to separate releases:

**MVP Slice Criteria**:
- Covers the complete user journey end-to-end
- Provides minimum valuable experience
- Can be delivered in reasonable timeframe
- Validates core assumptions

**Release Planning Guidelines**:
- Each release should deliver user value
- Consider dependencies between stories
- Balance effort across releases
- Include technical enablers where needed

### Step 6: Identify Gaps and Opportunities

Review the complete map:

**Gap Analysis Questions**:
- Are there steps with no stories?
- What happens if something goes wrong?
- Are error states covered?
- What about edge cases?

**Opportunity Identification**:
- What would delight users?
- What do competitors offer?
- What have users requested?
- What could differentiate the product?

### Step 7: Validate and Refine

Finalize the story map with the team:

**Validation Workshop**:
1. Walk through the map as a user
2. Identify any missing steps
3. Question priority decisions
4. Estimate effort for stories
5. Confirm release boundaries

**Refinement Checklist**:
- [ ] All activities have steps
- [ ] All steps have stories
- [ ] Stories follow format
- [ ] Priorities are justified
- [ ] MVP is achievable
- [ ] Team understands the map

## Anti-Patterns to Avoid

### Anti-Pattern 1: Flat Backlog Mapping
**Problem**: Simply arranging existing stories without considering the journey.
**Solution**: Start fresh with the user journey, then map existing stories.

### Anti-Pattern 2: Feature-Centric Thinking
**Problem**: Organizing around features instead of user goals.
**Solution**: Always ask "What is the user trying to accomplish?"

### Anti-Pattern 3: Perfect Planning
**Problem**: Trying to map every possible scenario before starting.
**Solution**: Map enough to start, iterate and expand as you learn.

### Anti-Pattern 4: One-Person Creation
**Problem**: Creating the map alone without team input.
**Solution**: Facilitate collaborative workshops with diverse perspectives.

### Anti-Pattern 5: Ignoring User Research
**Problem**: Mapping assumptions instead of validated user needs.
**Solution**: Base activities and steps on actual user research data.

## Common Pitfalls and Solutions

| Pitfall | Warning Signs | Solution |
|---------|---------------|----------|
| Too Many Activities | More than 9 activities | Group related activities |
| Vague Steps | Steps don't describe actions | Use specific action verbs |
| Missing Users | No persona focus | Always reference personas |
| Giant Stories | Stories need multiple sprints | Break into smaller stories |
| Priority Inflation | Everything is "Must Have" | Force-rank within categories |
| Dependency Ignorance | Release order doesn't work | Map technical dependencies |

## Templates

### Quick Story Map Template

```
╔════════════════════════════════════════════════════════════════╗
║                     USER STORY MAP                             ║
║                    Product: [Name]                             ║
╠════════════════════════════════════════════════════════════════╣
║ PERSONA: [Primary user description]                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  ACTIVITY 1        ACTIVITY 2        ACTIVITY 3                ║
║  ──────────        ──────────        ──────────                ║
║                                                                 ║
║  Step 1.1          Step 2.1          Step 3.1                  ║
║  ├─ Story A        ├─ Story D        ├─ Story G                ║
║  └─ Story B        └─ Story E        └─ Story H                ║
║                                                                 ║
║  Step 1.2          Step 2.2          Step 3.2                  ║
║  ├─ Story C        └─ Story F        └─ Story I                ║
║                                                                 ║
╠════════════════════════════════════════════════════════════════╣
║  ═════════════════ MVP RELEASE ═════════════════              ║
║  Stories: A, B, D, E, G                                        ║
╠════════════════════════════════════════════════════════════════╣
║  ───────────── FUTURE RELEASES ──────────────                  ║
║  Release 2: C, F, H                                            ║
║  Release 3: I, enhancements                                    ║
╚════════════════════════════════════════════════════════════════╝
```

### User Story Card Template

```
┌─────────────────────────────────────────────┐
│ STORY ID: [ID]          Priority: [P1-P4]   │
├─────────────────────────────────────────────┤
│ AS A [persona],                             │
│ I WANT TO [action],                         │
│ SO THAT [benefit].                          │
├─────────────────────────────────────────────┤
│ ACCEPTANCE CRITERIA:                        │
│ □ [Criterion 1]                             │
│ □ [Criterion 2]                             │
│ □ [Criterion 3]                             │
├─────────────────────────────────────────────┤
│ ESTIMATE: [Story Points]                    │
│ RELEASE: [MVP/v1.1/v1.2]                    │
└─────────────────────────────────────────────┘
```

## Cross-References

### Related Skills
- **backlog-refinement**: For breaking down and estimating stories
- **product-roadmap**: For long-term planning beyond releases
- **user-personas**: For detailed persona development
- **acceptance-criteria**: For writing better story criteria

### External Resources
- Jeff Patton's "User Story Mapping" book
- "User Story Mapping: A Complete Guide" on Medium
- Atlassian's Story Mapping Tutorial
- Miro's Story Mapping Templates

## Tips for Facilitation

**Workshop Setup**:
- Use a large physical wall or digital board (Miro, FigJam, Mural)
- Have sticky notes in multiple colors for priorities
- Allow 2-4 hours for initial mapping session
- Include cross-functional team members

**Facilitator Actions**:
1. Start with persona review (10 min)
2. Generate activities silently, then share (15 min)
3. Arrange activities in sequence (10 min)
4. Add steps under each activity (20 min)
5. Write stories for each step (30 min)
6. Prioritize as a group (20 min)
7. Slice releases (15 min)
8. Identify gaps (15 min)
9. Create action items (10 min)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025 | Added YAML frontmatter, example prompts, output format, templates |
| 1.0 | Original | Basic 7-step process from skills.sh |
