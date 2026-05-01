---
title: "Azure AI Foundry: The PTU Trap Behind TPM Scarcity"
publishDate: 2026-05-14
tags:
  - cloud-architecture
  - finops
  - ai-strategy
type: blog-linkedin-share
linkedinPostId: "pending"
variant: medium
sourcePost: "content/posts/000004-ptu-vs-tpm-azure-ai-foundry.md"
canonicalUrl: "https://zach.olinske.com/posts/000004-ptu-vs-tpm-azure-ai-foundry"
hashtags:
  - AzureAI
  - FinOps
  - CloudArchitecture
---

A customer asked me to help them get GPU capacity on Azure.

We checked the region. Pay-as-you-go throughput was effectively unavailable. The realistic path was PTU.

Customers who do get PTU can end up using only a small fraction of it. They still will not release it, because they know they may never get it back.

That is the problem.

PTU creates certainty, but it also creates hoarding when supply is tight. The cloud promise breaks when the allocation model rewards holding capacity more than using it.

In low-utilization cases, PTU can look wildly inefficient versus TPM, so the waste becomes a FinOps issue too.

I wrote about what is happening and how to think about it before you commit too early.

Has your team tried to get AI capacity recently? Did you go TPM, PTU, or multi-region?
