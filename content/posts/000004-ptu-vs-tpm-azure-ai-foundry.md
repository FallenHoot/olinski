---
title: "Azure AI Foundry: The PTU vs TPM Debate You Cannot Ignore"
description: "PTUs sell out in 24 hours. Most customers use 6% of what they reserve. TPMs get zero allocation because PTU is more commercially viable. The cloud was supposed to let you scale what you need and give back the rest. Here is what is actually happening and what you should do about it."
publishDate: 2026-05-20
tags:
  - cloud-architecture
  - finops
  - ai-strategy
  - azure
status: draft
---

The cloud was built on a promise: use what you need, give back the rest, pay for what you consumed.

That promise was always idealized. NIST defines cloud computing around rapid elasticity and measured service. Every hyperscaler markets pay-as-you-go. In practice, the promise requires deliberate architecture, governance, and operational discipline. You pay for VM sizes, not CPU cycles. You pay for database SKUs, not queries. Capacity is not automatically reclaimed unless you design for autoscaling and shutdown. The moment you buy Reserved Instances or Savings Plans, you are trading elasticity for price predictability. That tradeoff is often correct. It is also a departure from the original promise.

I accept all of that. Cloud has always had coarse allocation, baseline costs for stateful services, and commitments that dilute the elasticity model.

What I do not accept is a system where the pay-as-you-go option has zero allocation, where committed capacity sells out in 24 hours, and where customers hoard resources at 6% utilization because releasing them means losing them forever. That is not a tradeoff. That is a broken model.

Provisioned Throughput Units are where this breaks.

I am not speaking for Microsoft here. This reflects what I see working with large enterprises across regions.

I work with the 15 largest companies in Norway and several international ones. I have this conversation every month. A customer wants to deploy an AI workload on Azure AI Foundry. They ask about pay-as-you-go pricing (TPM, Tokens Per Minute). I reach out to Azure capacity leads. The answer comes back: the tokens-per-minute SKU has zero allocation in your region. All available GPU capacity was assigned to PTU. PTU sold out within 24 hours of being released.

The customer now has two options: buy PTU capacity they will barely use, or wait for an allocation that may never come.

This is not a pricing optimization question. This is a structural capacity allocation decision that changes the economics of AI for every enterprise on Azure.

## How GPU capacity actually gets allocated

When new servers arrive in an Azure region, they are bare metal hardware. They get provisioned into Azure Resource Manager and assigned to product teams. Some go to VM SKUs. Some go to Azure AI Foundry.

Within AI Foundry, that capacity gets split between PTU (provisioned, committed) and TPM (pay-as-you-go, on-demand). Because PTU is more commercially viable for Azure (committed revenue, predictable utilization from Microsoft's perspective), PTU gets the allocation. TPM gets what is left, which in many regions is zero.

This means the shortage customers experience is not just a GPU supply problem. It is a prioritization decision. The hardware exists. The allocation went to PTU.

## The 6% problem

Based on my analysis across enterprise customers, single-digit utilization is common in early enterprise AI deployments. Approximately 6% is a representative midpoint from what I see in practice.

The math: most enterprise teams work roughly 9 to 5, Monday through Friday. That is 40 hours out of 168 hours in a week, or about 24% of available time. Within those working hours, AI workloads are not running every second. Inference requests are bursty, not continuous. A realistic estimate of actual token consumption against reserved capacity lands around 6%.

That means 94% of the capacity enterprises are paying for sits idle. Not because they overprovisioned by accident, because the alternative (releasing PTU and hoping to get it back later) is worse.

Azure's own documentation confirms the trap: "Scaling down or deleting a deployment releases capacity. There is no guarantee that the capacity is available if the deployment is scaled up or re-created later."

Release your PTU and you might never get it back. So you hoard.

## What PTU and TPM actually are

For the CTO or business leader reading this who needs the fundamentals:

**PTU (Provisioned Throughput Units)** is reserved AI inference capacity. You commit to a throughput level and pay whether you use it or not. It gives you dedicated capacity, lower latency under load, and pricing guarantees for the commitment term.

**TPM (Tokens Per Minute, Standard deployment)** is pay-as-you-go. You pay per token consumed. No commitment. Scale up and down instantly. The cloud promise.

| | PTU | TPM (Standard) |
|---|---|---|
| Pricing model | Fixed monthly/hourly commitment | Per-token consumption |
| Minimum | 15 PTU (Global), 50 PTU (Regional) | None |
| Shortest commitment | Hourly (at premium), 1-month reservation | None |
| Capacity guarantee | Quota approved does not guarantee deployment will succeed | Shared pool, subject to throttling |
| Unused capacity | Lost. Does not carry over. | You only pay for what you use. |
| Cancel mid-term | Exchange/refund with $50K cap in 12-month window | No commitment to cancel |

The financial comparison at different utilization levels (GPT-4o class, 15 PTU minimum, ~51K TPM capacity):

| Utilization | Standard Token Cost | PTU Reservation ($4,290/mo) | Overpay Factor |
|---|---|---|---|
| 100% | ~$3,856 | $4,290 | 1.1x (near break-even) |
| 60% | ~$2,314 | $4,290 | 1.9x |
| 25% | ~$964 | $4,290 | 4.5x |
| 10% | ~$386 | $4,290 | 11.1x |
| 6% | ~$242 | $4,290 | 17.7x |

PTU only makes financial sense at very high sustained utilization, often north of 80-90% depending on model and pricing. At 6% utilization, you are paying 17.7 times what the tokens would cost on-demand. Most enterprises starting AI workloads are well below 60% in the first year.

## The chicken-and-egg problem

When customers ask me whether to buy PTU now or wait, here is the reality: there is no such thing as waiting. PTU capacity is gone within 24 hours after it is released because there is already a backlog in the queue. I do not know when more capacity for a specific model will be available in a specific region. It could be next month. It could be six months from now.

So the customer faces a risk decision:

- Buy PTU today and waste 94% of the bill each month until your workload grows into it?
- Buy a fraction of your projected need and hope you do not hit 100% before more capacity appears?
- Skip PTU entirely, use Standard deployment (TPM), and accept potential throttling and no latency guarantees?
- Rearchitect your application to use smaller models for simple tasks and reserve the expensive models for complex ones?

Every option is a gamble. None of them should be. This is what happens when capacity allocation favors committed revenue over customer flexibility.

## Why this is happening: the infrastructure wall

This is not just an Azure problem. The entire industry is capacity constrained. Understanding why changes how you evaluate the decision.

**$475 billion in CapEx, still not enough.** In 2026, the three major cloud providers plan to spend a combined $475-483 billion on infrastructure. Amazon: ~$200 billion. Alphabet: $175-185 billion. Microsoft: ~$98 billion annualized. Andy Jassy wrote in Amazon's 2025 shareholder letter (April 9, 2026): "We are not investing approximately $200 billion in capex in 2026 on a hunch." He also confirmed: "We still have capacity constraints that yield unserved demand."

**GPU supply is not the bottleneck anymore. Power is.** TSMC CEO C.C. Wei stated in the Q1 2026 earnings call (April 16, 2026) that the AI chip shortage is expected to last until at least 2027. New fabs take 2-3 years to build and "there are no shortcuts." AWS added 3.9 gigawatts of new power capacity in 2025 and is buying land next to nuclear plants. Northern Virginia data center projects are delayed 2-3 years because the local grid cannot provide the power.

**HBM memory is sold out through 2026.** Even if GPU production scales, the specialized high-bandwidth memory (HBM3e) required for AI accelerators is 100% reserved through December 2026. Samsung and SK Hynix raised HBM3E prices approximately 20% for 2026 deliveries.

**Costs are coming down, just not yet.** Alphabet reduced Gemini serving costs by 78% over 2025 (Sundar Pichai, Q4 2025 earnings, February 4, 2026). Microsoft's Maia 200 custom silicon delivers 30% better performance per dollar. Amazon's Trainium chips offer 30-40% better price-performance than comparable GPUs. The deflationary signal is real, which means locking in today's PTU price for 12 months carries pricing decay risk.

## The supply chain nobody talks about in cloud procurement

Most CTOs evaluating PTU vs TPM think the constraint is GPU availability. The actual constraint chain is longer and more fragile than that.

A GPU starts as sand. Silicon dioxide gets refined into ultra-pure silicon, grown into a crystal ingot, and sliced into wafers. Those wafers go through roughly 100 cycles of deposition, lithography, etching, and metrology before they become chips. The chips get stacked with high-bandwidth memory (HBM), packaged using advanced techniques like TSMC's CoWoS, and assembled into the GPU modules that end up in Azure data centers.

Every step in that chain has a bottleneck. Here are the ones that matter for your AI procurement decision:

**Helium.** The semiconductor industry consumes 24% of the world's helium supply, the largest single sector. That share is projected to reach 30% by 2030. Helium is irreplaceable in chip manufacturing. It cools the EUV lithography machines that ASML builds (the only company that makes them). It provides the inert atmosphere for silicon crystal growth. It is used for vacuum leak detection at every fab. There is no substitute. Fabs carry approximately one week of on-site helium supply.

Qatar produces 30-35% of the world's helium from the Ras Laffan complex. In early 2026, the Strait of Hormuz was closed following military operations. Iran attacked Qatar's largest LNG facility in March, damaging helium production lines. QatarEnergy declared force majeure. US helium distributors cut deliveries by 50%. The repair timeline for Ras Laffan is estimated at up to 5 years.

Taiwan sources 69% of its helium from Middle Eastern nations. South Korea sources 55%. Those are the countries where TSMC, Samsung, and SK Hynix fabricate and package the chips that become your GPUs.

Phil Kornbluth, a helium industry consultant, put it plainly: "There is a tsunami coming, but it is still a thousand miles offshore. Right now, it is still sunny on the beach."

**TSMC concentration.** TSMC fabricates approximately 90% of the world's leading-edge chips (sub-5nm). All Nvidia Blackwell GPUs are manufactured there. All of this production is in Taiwan.

**HBM memory.** SK Hynix and Samsung produce over 95% of the world's high-bandwidth memory. Without HBM3e, GPUs cannot be completed. Production is 100% reserved through December 2026. Prices are up approximately 20%.

**The chain reaction.** Qatar gas fields feed helium to East Asian fabs. Those fabs produce the wafers that become GPUs. Those GPUs go to data centers that need gigawatts of power the grid cannot provide. Those data centers run the Azure AI Foundry capacity that gets split between PTU and TPM. Every constraint upstream tightens the capacity downstream.

When someone tells you PTU is sold out in your region, this is the chain they are not explaining. It is not just a software allocation decision. It is sand and helium and power and memory and packaging and shipping, all of it constrained simultaneously.

## How AWS and GCP handle this differently

I hear from customers who use multiple clouds that AWS and GCP do not create the same scarcity dynamic. The research confirms meaningful structural differences.

| Feature | Azure PTU | AWS Bedrock | GCP Vertex AI |
|---|---|---|---|
| Default path | Standard (pay-per-token) exists, often has zero allocation | On-Demand is always available | Pay-as-you-go is always available |
| Shortest commitment | Hourly (at premium) or 1-month reservation | No commitment required for on-demand | 1 week |
| Capacity guarantee | "Quota does not guarantee capacity." Sell-outs documented. | On-demand is the baseline, always available | "Minutes to weeks" fulfillment |
| Overage handling | 429 errors (throttled, must configure spillover) | N/A (on-demand is baseline) | Auto-billed as pay-as-you-go |
| Unused capacity | Lost. No carry-over. | Lost during commitment | Lost. Fixed cost. |
| Model switching | Full flexibility across models within deployment type | Must buy new provisioned throughput per model | Switch within same publisher mid-term |

The critical difference: AWS defaults to on-demand and treats provisioned throughput as an optional optimization for high-volume workloads. GCP offers 1-week commitments with automatic overage billing. In practice, Azure customers experience pay-as-you-go scarcity far more frequently than on AWS or GCP.

I cannot verify whether AWS and GCP explicitly prioritize on-demand over provisioned in their internal allocation. What I can verify from their public documentation is that on-demand availability is their baseline, not an afterthought.

## My position

I advocate for TPMs. I do this internally at Microsoft, and I will say it here.

The promise of the cloud is to scale what you need and give back the rest. PTU breaks that promise when capacity sits 94% idle because customers are afraid to release it.

If my analysis is correct and most enterprise PTU deployments run at approximately 6% utilization, then the majority of provisioned AI capacity in Azure is being wasted. That is bad for customers and bad for the ecosystem. Capacity that sits idle in one customer's PTU allocation could serve another customer's on-demand request.

I understand why PTU exists from Azure's perspective. Committed revenue is predictable. Capacity planning is easier when customers pre-commit. The commercial incentive is real.

I also understand why customers buy PTU even at 6% utilization. The alternative is worse. If releasing PTU means losing access to AI capacity entirely, hoarding is rational.

The system is the problem, not the customers or the product team. The incentives are misaligned.

## What I would change

If I could influence the model:

1. **Guarantee TPM allocation.** Every region should have a minimum percentage of AI capacity reserved for on-demand. Forcing 100% of capacity to PTU punishes customers who follow the cloud's consumption model.
2. **Allow PTU burst-down.** If your utilization is below 30% for a billing period, the unused portion should credit toward future months or convert to on-demand tokens. Wasted capacity benefits nobody.
3. **Publish regional utilization data.** Let customers see aggregate PTU utilization by region. If the industry average is 6%, customers deserve to know before committing.
4. **Shorten minimum commitments.** GCP offers 1-week terms. Azure's minimum meaningful commitment is 1 month. In a market where model capabilities and pricing change quarterly, shorter terms reduce risk.

Change my mind.

## What to do this week

If you are a CTO or business leader evaluating AI procurement on Azure:

1. **Do not buy PTU without 3 months of production token data.** If you do not have usage history, start with Standard deployment and measure. The 17.7x overpay at 6% utilization is real.
2. **Calculate your actual utilization.** Not projected. Actual. Hours of active inference divided by hours in the month. If it is below 30%, PTU is not saving you money.
3. **Ask your Azure account team about TPM allocation in your region.** If the answer is zero, ask why. Ask when it will be available. Document the answer.
4. **Evaluate multi-cloud for AI workloads.** If Azure cannot provide on-demand capacity for your workload, AWS Bedrock and GCP Vertex AI offer on-demand as the default path. This is not disloyalty. This is procurement.
5. **Rearchitect before you reserve.** Can simpler tasks use a smaller model (GPT-4o-mini instead of GPT-4o)? Can batch inference run overnight at lower cost? Reduce the throughput you need before committing to throughput you will waste.
6. **Watch the deflationary signals.** Alphabet cut serving costs 78% in one year. Microsoft's Maia 200 and Amazon's Trainium are both delivering 30%+ better performance per dollar. Locking in today's PTU price for 12 months means paying 2025 rates on 2026 silicon.

The AI infrastructure shortage is real. The $475 billion in hyperscaler CapEx proves it. The question is not whether capacity will eventually arrive. It will. The question is whether the pricing and allocation model serves customers during the gap.

Right now, it serves committed revenue. The cloud promise says it should serve workloads.

---

**Disclaimer:** I work at Microsoft. The views expressed here are my own and based solely on publicly available information. This content is for educational purposes and does not represent official Microsoft guidance or commitments.
