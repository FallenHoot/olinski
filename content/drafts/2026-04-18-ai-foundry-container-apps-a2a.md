---
title: "Azure AI Foundry Agents + Container Apps: Building Scalable A2A Solutions"
description: "Agent-to-Agent (A2A) patterns combine Azure AI Foundry agents with Container Apps for asynchronous, scalable multi-agent systems. Here is the reference architecture."
publishDate: 2026-04-18
tags:
  - architecture
  - ai
  - agents
  - azure
status: draft
---

Chaining agents synchronously works fine for proof-of-concept.

At scale, you need agents to work asynchronously.

Agent-to-Agent (A2A) is the pattern: agents queue work for each other, agents process independently, agents surface results when ready.

Azure AI Foundry agents + Container Apps is a natural fit for this.

## Why this matters

Synchronous agent chains fail when:

- Agent B takes 30 seconds; your API caller times out.
- Agent C fails; the entire chain fails with it.
- Load spikes and all agents compete for the same compute.

Asynchronous A2A fixes all three.

Agent A queues a job; Agent B processes when ready; results are stored; caller polls or gets notified when done.

## Framework or model

Reference architecture:

1. **Azure AI Foundry Agent:** Express logic, invoke tools, store results in Cosmos DB or data layer.
2. **Azure Service Bus:** Queue agent jobs (A publishes, B subscribes).
3. **Container Apps:** Host agent implementations, auto-scale based on queue depth.
4. **Data layer:** Cosmos DB or blob storage for state between agents.

## Practical implementation

Example: Cost optimization agent -> compliance agent -> reporting agent

1. Cost agent analyzes spend, suggests optimizations, publishes to queue.
2. Compliance agent reads queue, validates against policy, publishes approved suggestions.
3. Reporting agent reads approved, generates report, stores in blob.

Each agent independent, scalable, recoverable.

## What to do this week

1. Review your multi-agent design (from previous post).
2. Identify which handoffs are performance-critical.
3. For async candidates, sketch queue publisher/subscriber model.
4. Map agents to Container Apps images.
5. Design Cosmos DB schema for shared state.

Async systems are more resilient and scalable.

Worth the added complexity.

I work at Microsoft. The views expressed here are my own and based solely on publicly available information. This content is for educational purposes and does not represent official Microsoft guidance or commitments.
