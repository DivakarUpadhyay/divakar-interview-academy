---
slug: leadership
title: Team Lead, Managerial & Agile Interview
track: career
order: 2
icon: TL
color: #5c7cfa
summary: The tech lead vs engineering manager role, SDLC and Agile/Scrum/Kanban, estimation and planning, delegation, mentoring, performance management, conflict resolution, stakeholder management, risk and incident management, hiring, technical decision-making and model answers for managerial rounds.
---

# Overview

**Managerial / techno-managerial rounds** (often with a delivery manager, engineering manager, director or client) test whether you can deliver through a team — not just code. For senior developer, tech lead, team lead, project lead and engineering manager roles, expect questions on:

- **Delivery**: planning, estimation, sprint management, risk, deadlines, scope changes.
- **People**: delegation, mentoring, motivation, feedback, underperformers, conflict, hiring.
- **Stakeholders**: clients, product owners, escalations, saying no, status reporting.
- **Technical leadership**: architecture decisions, code quality, technical debt, production incidents.
- **Process**: Agile/Scrum/Kanban, SDLC, DevOps metrics, documentation.

| Role | Main focus |
|---|---|
| **Senior developer** | Complex features, quality, reviews, guiding juniors |
| **Tech lead** | Technical direction, design, code quality, unblocking the team; still codes a lot |
| **Team lead** (common in Indian IT services) | Tech + people + delivery for a small team; client interaction; task allocation |
| **Engineering manager** | People (hiring, growth, performance), process, delivery, cross-team collaboration; less coding |
| **Project / delivery manager** | Scope, schedule, budget, risks, client relationship, reporting |
| **Architect** | System-wide design, standards, technology choices, non-functional requirements |

# Versions

Management and delivery methods have evolved:

| Year | Milestone |
|---|---|
| 1970 | Winston Royce's paper (commonly cited as the origin of the "Waterfall" model, though it argued for iteration) |
| 1986 | Takeuchi & Nonaka's "The New New Product Development Game" — inspiration for Scrum |
| 1995 | Scrum presented by Ken Schwaber and Jeff Sutherland |
| 1996–1999 | Extreme Programming (Kent Beck) |
| **2001** | **Agile Manifesto** (4 values, 12 principles) |
| 2004–2010 | Kanban for software (David J. Anderson); first Scrum Guide (2010) |
| 2009 | "DevOps" term (Patrick Debois' DevOpsDays) |
| 2011 | SAFe (Scaled Agile Framework) 1.0 |
| 2014–2018 | DORA research; *Accelerate* book (2018) |
| **2020** | Current **Scrum Guide** revision (Product Goal, one Scrum Team, "Developers") |
| 2020s | Remote/hybrid teams, platform engineering, SPACE framework for developer productivity, AI-assisted development |

# Lifecycle

**SDLC (Software Development Life Cycle) phases:** Requirements → Analysis → Design → Implementation → Testing → Deployment → Maintenance. Models: **Waterfall** (sequential), **V-Model** (testing paired with each phase), **Iterative/Incremental**, **Spiral** (risk-driven), **Agile** (Scrum, Kanban, XP), **DevOps** (continuous delivery and operations).

**Scrum lifecycle (per sprint, 1–4 weeks, commonly 2):**

1. **Product Backlog** (owned by the Product Owner, ordered by value) with refinement sessions.
2. **Sprint Planning** — why (Sprint Goal), what (selected backlog items), how (plan/tasks) → **Sprint Backlog**.
3. **Daily Scrum** — 15 minutes for Developers to inspect progress toward the Sprint Goal and adapt.
4. Development work; **Definition of Done** applied to every increment.
5. **Sprint Review** — demo the increment to stakeholders, adapt the backlog.
6. **Sprint Retrospective** — improve how the team works.
7. Repeat.

Scrum roles (accountabilities): **Product Owner**, **Scrum Master**, **Developers**. Artifacts: **Product Backlog** (commitment: Product Goal), **Sprint Backlog** (Sprint Goal), **Increment** (Definition of Done).

**Team development lifecycle (Tuckman):** **Forming** → **Storming** → **Norming** → **Performing** (→ Adjourning). A lead adapts style: directive early, coaching during storming, supportive/delegating when performing.

**Incident lifecycle:** detect → triage/assess severity → communicate → mitigate/restore → resolve root cause → **blameless post-mortem** → follow-up actions.

# Tools

| Area | Tools |
|---|---|
| Work tracking | Jira, Azure Boards, Linear, GitHub Projects, Trello |
| Documentation | Confluence, Notion, SharePoint, Azure DevOps Wiki, architecture decision records (ADRs) |
| Communication | Microsoft Teams, Slack, Zoom, Outlook |
| Planning & estimation | Planning poker (story points), roadmaps, Gantt (MS Project) for fixed-scope work |
| Metrics | DORA metrics, velocity, cycle time, burndown/burnup, cumulative flow diagrams |
| Quality | SonarQube, code review policies, test coverage, defect tracking |
| Incident management | PagerDuty, Opsgenie, Azure Monitor alerts, status pages |
| People | 1:1 notes, OKRs/goals tools, performance review systems (Workday, SuccessFactors) |
| Diagrams | draw.io, Lucidchart, Excalidraw, C4 model |

# Module: The Role

## Lesson: [Basic|High] From developer to tech lead: what changes

| Developer | Lead |
|---|---|
| Measured by own output | Measured by **team output** and outcomes |
| Solves assigned problems | Defines problems, breaks them down, assigns |
| Deep in code | Code + design reviews + unblocking + communication |
| Reports status | Owns status, risks and expectations with stakeholders |
| Responds to decisions | Makes and explains decisions, accepts accountability |

Typical lead time split: ~30–60% hands-on technical work, the rest planning, reviews, mentoring, meetings and stakeholder communication. A common trap: being the "hero" who does the hardest work alone — it doesn't scale and blocks the team's growth.

## Lesson: [Basic|High] Agile, Scrum and Kanban essentials

**Agile Manifesto values:** individuals and interactions over processes and tools; working software over comprehensive documentation; customer collaboration over contract negotiation; responding to change over following a plan.

| | Scrum | Kanban |
|---|---|---|
| Cadence | Fixed sprints | Continuous flow |
| Roles | PO, Scrum Master, Developers | No prescribed roles |
| Commitment | Sprint backlog / goal | WIP limits per column |
| Change | Usually between sprints | Any time |
| Metrics | Velocity, burndown | Cycle time, lead time, throughput, CFD |
| Best for | Product development with planning cycles | Support/maintenance, ops, unpredictable work |

Terms: **user story** ("As a … I want … so that …") with **acceptance criteria** (Given/When/Then), **story points** (relative effort/complexity, Fibonacci), **velocity**, **Definition of Ready / Done**, **epic → feature → story → task**, **spike** (time-boxed research), **MVP**, **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable).

## Lesson: [Intermediate|High] Estimation and planning

- Break work down until pieces are ≤ 1–3 days; unknowns become spikes.
- **Relative estimation** (story points + planning poker) builds shared understanding; use historical **velocity** for sprint capacity.
- For fixed-date/fixed-scope client projects: bottom-up estimates in hours/days + **three-point estimates** (optimistic, most likely, pessimistic → PERT: (O + 4M + P) / 6) + contingency (often 15–25%) + explicit assumptions.
- Include non-coding work: code review, testing, deployment, documentation, meetings, holidays, support load.
- Re-estimate when you learn more; communicate changes early.
- Make trade-offs explicit: **scope, time, cost, quality** (the iron triangle — quality shouldn't be the variable).

## Lesson: [Intermediate|High] Delegation and task allocation

- Delegate **outcomes**, not just tasks: context (why), expected result, constraints, deadline, how and when to check in.
- Match tasks to **skill and growth**: stretch tasks for growth with support; critical-path work to experienced members; pair juniors with seniors.
- Use situational leadership: **directing** (new/low skill) → **coaching** → **supporting** → **delegating** (expert, motivated).
- Avoid single points of failure — rotate knowledge (pairing, documentation, code reviews).
- Track on the board, not via constant status chasing; be available to unblock.

## Lesson: [Intermediate|High] Mentoring, feedback and 1:1s

- **1:1s** (weekly/biweekly, 30 min): their agenda first — blockers, growth, wellbeing, feedback both ways.
- Feedback models: **SBI** (Situation – Behaviour – Impact), timely, specific, private for criticism, public for praise.

> "In yesterday's client call (situation), you jumped in to correct the client mid-sentence twice (behaviour). The client seemed annoyed and the call ran long (impact). Next time, can you note your point and raise it when they finish? Happy to role-play before the next call."

- Growth: individual development plans, stretch assignments, certifications, tech talks, gradual ownership.
- Psychological safety: people can admit mistakes and ask questions without fear — the strongest predictor of team effectiveness in Google's Project Aristotle research.

## Lesson: [Intermediate|High] Handling underperformance

1. **Observe and gather facts** (missed deliverables, quality issues) — not impressions.
2. **Talk privately and early**: share specific examples, listen — find the cause (unclear expectations, skill gap, personal issue, motivation, wrong role).
3. **Agree a plan**: clear expectations, support (training, pairing, smaller tasks), timeline, check-ins.
4. **Follow up** regularly; recognise improvement.
5. If no improvement: involve your manager/HR for a formal **performance improvement plan (PIP)**, document everything, be fair and consistent.
6. Throughout: respect, confidentiality, no public criticism.

## Lesson: [Intermediate|High] Conflict resolution

Types: task conflict (what to do), process conflict (how), relationship conflict (personal). Healthy task conflict improves decisions; relationship conflict must be addressed quickly.

Approach:

1. Talk to each person privately; understand interests behind positions.
2. Bring them together; set ground rules; focus on facts and shared goals (customer, quality, deadline).
3. Generate options; decide using agreed criteria (data, spike/prototype, architecture principles) — or the lead decides if needed ("disagree and commit").
4. Document the decision (ADR) and follow up.

Thomas-Kilmann modes: competing, collaborating, compromising, avoiding, accommodating — collaborating is ideal for important issues; compromising when time is short.

# Module: Delivery and Stakeholders

## Lesson: [Intermediate|High] Stakeholder management and communication

- Identify stakeholders (client, PO, users, other teams, management) and what each cares about.
- Regular **status reporting**: progress vs plan, RAG (red/amber/green) status, risks, decisions needed, next steps — short and factual.
- **No surprises**: share bad news early with a plan ("We're 1 week behind on the payment module because the gateway sandbox was down for 3 days; options: A) cut feature X from this release, B) add one developer for 2 weeks, C) move the date to the 20th. I recommend A.").
- Say **no** (or "not now") with reasons and alternatives; protect the team from constant scope changes — route them through the backlog/change request process.
- Manage expectations in writing: scope, assumptions, acceptance criteria.

## Lesson: [Intermediate|High] Risk management and scope changes

- Maintain a **risk register**: risk, probability, impact, owner, mitigation, contingency.
- Common risks: unclear requirements, dependencies on other teams/vendors, key-person dependency, new technology, environments, data migration, performance, security/compliance.
- Strategies: **avoid**, **mitigate**, **transfer**, **accept**.
- **Scope creep**: every change goes through impact analysis (effort, timeline, risk) → agreement with the PO/client → change request or backlog reprioritisation. In fixed-price projects, formal change requests matter.

## Lesson: [Intermediate|High] Production incidents and post-mortems

- Define **severity levels** (Sev1: full outage/revenue impact; Sev2: major feature down; Sev3: minor).
- During an incident: an **incident commander** coordinates; separate roles for investigation and communication; focus on **restoring service first** (rollback, failover, feature flag off), root cause later; regular updates to stakeholders/status page.
- **Blameless post-mortem**: timeline, impact, root cause(s) (5 Whys), what went well, what didn't, action items with owners and dates.
- Track **MTTR** (mean time to restore) and **change failure rate**; invest in monitoring, alerting, runbooks and safe deployments.

## Lesson: [Advanced|High] Technical decision-making, debt and quality

- Decide with **criteria**: requirements (functional + non-functional — performance, scalability, security, availability, cost), team skills, time to market, maintainability, vendor lock-in.
- Use **spikes/proofs of concept** for uncertain choices; document with **Architecture Decision Records** (context, decision, alternatives, consequences).
- **Technical debt**: make it visible (backlog items with impact), allocate capacity (e.g. 15–20% per sprint), pay down debt in areas that change often, avoid "big rewrite" unless justified.
- Quality gates: code review standards, automated tests, CI checks, static analysis, Definition of Done.
- Build vs buy: core differentiators → build; commodity → buy/open source.

## Lesson: [Intermediate|Medium] Hiring and building teams

- Define the role (must-have vs nice-to-have skills), structured interview with consistent questions and scoring rubric, realistic coding/design tasks, panel diversity, and fast feedback to candidates.
- Hire for **skills + learning ability + collaboration**; avoid "culture fit" as an excuse for bias — look for "culture add".
- Onboarding plan: documentation, buddy, first-week small task in production, 30-60-90 goals.
- Retention: growth opportunities, recognition, fair workload, good tooling, meaningful work, career conversations.

## Lesson: [Intermediate|Medium] Metrics that matter

- **DORA**: deployment frequency, lead time for changes, change failure rate, time to restore (failed deployment recovery time).
- **Flow**: cycle time, throughput, WIP, blocked time.
- **Quality**: escaped defects, incident count/severity, test coverage trend.
- **Team health**: engagement surveys, attrition, on-call load.
- Avoid misuse: never compare individuals by velocity, lines of code or commits — it destroys trust and encourages gaming (Goodhart's law: when a measure becomes a target, it ceases to be a good measure).

# Interview

## [Beginner|High] What is the difference between a tech lead and an engineering manager?

A tech lead owns technical direction for a team: architecture and design decisions, code quality, breaking down work, unblocking developers and mentoring — and still writes significant code. An engineering manager owns people and delivery: hiring, career growth, performance reviews, team health, process and cross-team coordination, with less hands-on coding. In smaller teams (and in many Indian IT services companies' "team lead" roles) one person does parts of both.

## [Beginner|High] Explain Scrum roles, events and artifacts.

Accountabilities: Product Owner (maximises value, owns and orders the Product Backlog), Scrum Master (coaches the team and organisation in Scrum, removes impediments), Developers (create the increment, own the Sprint Backlog). Events: the Sprint (container), Sprint Planning, Daily Scrum (15 min), Sprint Review, Sprint Retrospective. Artifacts with commitments: Product Backlog → Product Goal, Sprint Backlog → Sprint Goal, Increment → Definition of Done (2020 Scrum Guide).

## [Beginner|High] What is the difference between Agile and Waterfall?

Waterfall is sequential — requirements, design, build, test, deploy — each phase completed before the next, with change being costly; it suits fixed, well-understood requirements and regulated contexts. Agile delivers in short iterations with working software each cycle, continuous feedback, and embraces change; it suits evolving requirements. Many enterprises use hybrids (fixed milestones with agile execution).

## [Beginner|Medium] What are story points and velocity?

Story points are relative estimates of effort, complexity and uncertainty (often Fibonacci: 1, 2, 3, 5, 8, 13), agreed by the team with planning poker — not hours. Velocity is the average number of points a team completes per sprint, used to forecast how much to plan. Velocity is team-specific: don't compare teams or use it as a performance target.

## [Beginner|Medium] Scrum vs Kanban — when would you use each?

Scrum works well for product development where you can plan in fixed sprints with a stable team and regular reviews. Kanban suits continuous, unpredictable inflow like support, maintenance and operations: work is pulled through columns with WIP limits, measured by cycle time. Teams often combine them ("Scrumban") — e.g. sprints for features with a Kanban lane for production support.

## [Intermediate|High] How do you estimate a project or a large feature?

Clarify scope and acceptance criteria; break it into small tasks (≤ 2–3 days) including testing, reviews, deployment and documentation; estimate with the people doing the work (planning poker or three-point estimates); add buffers for risks and unknowns (spikes for unclear areas); account for real capacity (meetings, support, leaves); state assumptions and dependencies explicitly; give a range rather than a single date; re-forecast as you learn and communicate changes early.

## [Intermediate|High] How do you delegate work in your team?

I delegate outcomes with context: why it matters, what done looks like, constraints, deadline and check-in points. I match tasks to skills and growth goals — a stretch task for a junior with a senior pairing, critical-path work for experienced people — and adjust my involvement to their experience (directing for new members, delegating to experts). Work is tracked on the board, I stay available to unblock, and I avoid taking the hardest tasks myself all the time so the team grows and I don't become a bottleneck.

## [Intermediate|High] How do you mentor junior developers?

Regular 1:1s and pairing sessions; clear coding standards and examples; code reviews that explain the *why* rather than just fixing things; gradually larger tasks with support (first a bug fix, then a small feature, then owning a module); encouraging questions and making it safe to make mistakes; sharing resources and certification paths; and celebrating progress publicly. I measure success by how independently they can deliver after a few months.

## [Intermediate|High] How do you handle a team member who is underperforming?

Gather facts first, then talk privately and early with specific examples, and listen to understand the cause (unclear expectations, skill gap, personal issues, motivation, wrong role). Agree on a concrete improvement plan with support — training, pairing, smaller scoped tasks — and regular check-ins. Recognise improvements. If there's no progress after a fair period, involve my manager and HR for a formal plan, documenting everything and treating the person with respect throughout.

## [Intermediate|High] How do you resolve a conflict between two team members?

Speak with each privately to understand their perspective and underlying concerns, then bring them together focused on facts and the shared goal. For technical disagreements, agree criteria and use data or a quick spike to decide; if still split, I make the call, explain the reasoning, record it (ADR) and ask both to commit. For personal friction, set expectations for respectful behaviour and follow up. I address conflict early, before it affects the team.

## [Intermediate|High] How do you handle scope changes requested in the middle of a sprint?

Protect the Sprint Goal. I acknowledge the request, assess urgency and impact with the Product Owner: if it's truly critical (production issue, regulatory), we swap out work of similar size and make the trade-off visible; otherwise it goes into the backlog for the next sprint planning. For client projects, significant changes go through impact analysis and a change request covering effort, timeline and cost.

## [Intermediate|High] How do you report project status to stakeholders?

Regular, concise updates: progress vs plan (with a RAG status), key achievements, risks and issues with mitigation plans, decisions needed from them, and next steps. I share bad news early with options and a recommendation, back statements with data (burnup charts, defect counts), tailor the detail to the audience (executives vs product owners), and keep a written record.

## [Intermediate|Medium] What do you do in a sprint retrospective that has become boring and repetitive?

Change the format (Start/Stop/Continue, 4Ls, sailboat, timeline), focus on one or two impactful improvements rather than long lists, review whether previous action items were done (and why not), use data (cycle time, escaped defects, interruptions), rotate the facilitator, and make it safe to raise uncomfortable topics. If the same issues keep coming back, escalate the systemic blockers outside the team.

## [Intermediate|Medium] How do you handle technical debt?

Make it visible as backlog items describing the business impact (slower delivery, incidents, security risk); prioritise debt in areas that change often or cause incidents; reserve regular capacity (e.g. 15–20% per sprint) or attach refactoring to related feature work (Boy Scout rule); prevent new debt with Definition of Done, reviews and automated quality gates; and avoid big-bang rewrites unless the case is very strong — prefer incremental Strangler Fig approaches.

## [Advanced|High] How do you make architecture or technology decisions in a team?

Start from requirements (including non-functional ones and constraints like budget, skills and timelines), list options, evaluate them against agreed criteria, run a spike or proof of concept for risky unknowns, involve the team and relevant experts, decide (and own the decision), and document it in an Architecture Decision Record with context, alternatives and consequences. Revisit decisions when context changes. I prefer reversible decisions made quickly and irreversible ones made carefully.

## [Advanced|High] How do you measure your team's performance?

At team level, never individuals by raw output: DORA metrics (deployment frequency, lead time, change failure rate, time to restore), flow metrics (cycle time, throughput, WIP), quality (escaped defects, incident trends), predictability (planned vs delivered), and team health (engagement, attrition, on-call load). Business outcomes — features adopted, customer issues resolved — matter most. I use metrics to find improvement opportunities, not to rank people.

## [Advanced|Medium] How would you build and scale a new team from 3 to 10 developers?

Define the team's mission and the roles needed (mix of seniorities and skills); set up a structured hiring process with a scorecard; create strong onboarding (docs, buddy, dev environment scripts, first-week deliverable); establish working agreements, coding standards, CI/CD and review practices before scaling; split into sub-teams or feature pods around 5–7 people with clear ownership as you grow; grow leaders internally (tech leads per pod); and keep communication channels clear (team rituals, ADRs, documentation).

## [Scenario|High] Your project is two weeks from the deadline and you realise it will be late by one week. What do you do?

Verify the estimate with the team and find the cause. Inform stakeholders immediately — no surprises — with options: reduce scope (ship must-haves first, defer nice-to-haves), add focused help where it actually speeds things up (not late-stage new joiners on complex code — Brooks's law), remove distractions from the team, parallelise testing, or move the date. Give a recommendation, get a decision in writing, update the plan, and run a retrospective later on why the risk wasn't spotted earlier.

## [Scenario|High] A critical production issue occurs on Friday evening. Walk me through how you handle it.

Acknowledge and assess severity; assemble the right people (on-call, owners) and appoint an incident lead; open a communication channel and inform stakeholders with regular updates. Prioritise restoring service — roll back the last deployment, toggle a feature flag, fail over, scale up — before deep root-cause analysis. Once stable, monitor, then do a blameless post-mortem the next week with a timeline, root causes (5 Whys), and owned action items (tests, alerts, runbooks, safer deployments). Make sure people who worked late get time off.

## [Scenario|High] The client keeps adding requirements without changing the deadline. How do you manage it?

Make the impact visible: maintain a prioritised backlog with estimates, show the client what each new request displaces, and agree priorities together (MoSCoW: Must/Should/Could/Won't). Use a change-request process for contractual scope, protect the current sprint, and propose phased delivery — an MVP by the date, the rest in later releases. Document decisions and keep the relationship collaborative rather than confrontational.

## [Scenario|High] Your best developer resigns in the middle of a critical release. What do you do?

Have an honest conversation to understand the reasons — if it's fixable (role, growth, compensation) and appropriate, explore a counter-offer with my manager, but don't rely on it. Immediately plan the knowledge transfer: document their modules, pair them with others during the notice period, record walkthroughs, and review critical code together. Re-plan the release with stakeholders based on reduced capacity. Longer term, reduce single points of failure by rotating ownership, and look at retention across the team.

## [Scenario|Medium] Two senior developers disagree strongly on using microservices versus a modular monolith for a new product. How do you decide?

Bring the discussion back to requirements: team size, expected scale, deployment independence needs, domain boundaries, operational maturity, timeline and cost. Have each present trade-offs against those criteria; if uncertain, run a short spike. For most new products with one team, a well-structured modular monolith is simpler and can be split later along module boundaries. Decide, document the reasoning and the triggers that would make us revisit it in an ADR, and ask both to commit.

## [Scenario|Medium] A team member is consistently working late and seems burned out. What do you do?

Talk privately and with care: ask how they're doing and what's driving the extra hours (workload, unclear priorities, perfectionism, personal stress, fear of failing). Reduce or redistribute their load, clarify priorities, remove blockers, encourage time off and normal hours, and check the team's overall planning so this isn't systemic. Point them to company support (EAP) if appropriate, and follow up regularly.

## [Scenario|Medium] You are asked to lead a team working on a technology you don't know well. How do you approach it?

Be honest about the gap and learn fast: study the architecture and fundamentals, pair with the team's experts and rely on them for detailed technical decisions, while I contribute leadership strengths — planning, unblocking, stakeholder management, quality practices. I'd get hands-on with small tasks to build credibility, use external help (docs, vendor support, other teams) and set myself a learning plan with milestones.

# Cheatsheet

## Leadership answer pattern

Context → my approach (principles) → concrete example (STAR) → result/metric → what I learned.

## Scrum quick facts

Roles: PO · Scrum Master · Developers. Events: Sprint · Planning · Daily (15 min) · Review · Retro. Artifacts: Product Backlog (Product Goal) · Sprint Backlog (Sprint Goal) · Increment (DoD). Scrum Guide 2020.

## Planning tools

INVEST stories · acceptance criteria · story points + planning poker · velocity · three-point/PERT (O + 4M + P)/6 · MoSCoW · risk register · RAG status.

## People tools

1:1s · SBI feedback · situational leadership (direct → coach → support → delegate) · Tuckman (form, storm, norm, perform) · psychological safety · PIP as last resort.

## Delivery tools

Definition of Done · WIP limits · change requests · ADRs · blameless post-mortems (5 Whys) · DORA metrics · tech-debt budget 15–20%.

## Phrases that work

"Here are three options and my recommendation." · "What will we drop to add this?" · "Disagree and commit." · "Let's restore service first, then find root cause." · "What does success look like for you?"

## Avoid

Blaming the team · hero culture · comparing individuals by velocity · hiding bad news · promising dates without the team's estimate.
