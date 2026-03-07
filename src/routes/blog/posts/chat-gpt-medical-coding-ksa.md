---
title: "Why LLMs Cannot Solve Medical Coding in Saudi Arabia — And What Actually Can"
date: 2026-03-07
excerpt: A wrong medical code isn't just a data error. It's a rejected claim, an audit trigger, or a compliance exposure. Yet most AI coding tools are built on LLMs that have never seen ICD-10-AM, ACS rules, or CHI guidelines — and they fail confidently.
category: AI, Healthcare
---

There's a narrative going around in health tech right now. It goes something like this: *LLMs are incredibly capable, medical coding is just mapping clinical text to codes, therefore LLMs can handle medical coding.*

It sounds reasonable. It isn't.

This isn't an argument against LLMs. They're genuinely impressive tools. But impressive in general doesn't mean fit for purpose. And in KSA medical coding specifically, the mismatch between what LLMs are and what this problem requires is significant enough that deploying one and hoping for the best isn't just a technical mistake — it's a compliance risk.

Let's break down why.

---

## First, What KSA Medical Coding Actually Requires

This is where the conversation usually goes wrong, because most people have ICD-10 in their head as a single, universal standard. It isn't.

In Saudi Arabia, the standard is **ICD-10-AM, 10th edition** — the Australian Modification. It has 41,834 codes. ICD-10-CM, the US version most LLMs have been trained on, has 95,831 codes. The international version has 12,267. These are not interchangeable. The code sets overlap but diverge in ways that matter — structure, hierarchy, specificity, and applicable rules are all different.

On top of the code set itself, you have two layers of rules that govern how codes are applied:

**ACS Rules (Australian Coding Standards)** — guidelines that determine how you select, sequence, and combine codes. Which diagnosis goes first. When a symptom can be coded independently versus when it's absorbed into a higher-level diagnosis. What counts as an additional diagnosis worth capturing.

**CHI Rules** — Saudi-specific rules from the Council of Health Insurance that layer on top of ACS. These govern what's billable, what combination of codes is valid for a claim, and what gets rejected.

Here's the part that makes this genuinely hard: many of these rules are **dynamic**. A code combination that's valid for a 65-year-old male may not be valid for a 30-year-old female. Patient age, gender, and clinical context directly influence which rules apply and which codes are permissible.

None of this is publicly available. These aren't standards you can find on a government website or in an academic paper. An LLM has never seen them because they simply aren't in any training corpus.

---

## The Clinical Language Problem

Even if we set aside the KSA-specific standards entirely, there's a second layer of difficulty: the input itself.

Clinical notes are not clean, structured data. They're compressed, implicit, and written for other clinicians — not for machines.

A doctor writes: *"Patient c/o SOB, known HTN, on metformin."*

What that actually means: the patient has shortness of breath as a presenting complaint, a background of hypertension, and is being treated for type 2 diabetes. A coding system needs to unpack all of that correctly — and know that *shortness of breath* in this context may or may not be independently codeable depending on whether a definitive diagnosis is established later in the note.

A few specific challenges worth naming:

**Negation** — "No evidence of pneumonia" and "pneumonia" are opposites, but they look similar to a system doing text matching. Clinical NLP researchers have spent years on this problem. It still isn't solved cleanly.

**Temporal context** — "History of MI" and "acute MI" map to completely different codes and carry completely different clinical and billing implications. The word *history* changes everything.

**Implicit diagnostic constructs** — When a physician writes "sepsis," they're not listing symptoms. They're invoking a clinical label that carries an entire bundle of implied criteria. A coding system needs to reason from that label, not just match the word.

**Abbreviations** — Clinical text is dense with shorthand that varies by specialty, by institution, and sometimes by individual physician. HTN, DM, AKI, SOB — context determines resolution.

The cumulative effect is that clinical text requires genuine reasoning to interpret correctly. Pattern matching on surface text produces errors that look plausible but aren't.

---

## Why Every Common Approach Falls Short

When teams try to build coding tools, they usually reach for one of a handful of approaches. Here's an honest look at each:

**Database lookup** — maintain a searchable index of ICD-10-AM codes and match input text against it. Works for simple, unambiguous cases. Breaks immediately on anything requiring clinical context. Doesn't know that "chest pain NOS" and "chest pain due to coronary artery disease" are coded differently.

**Entity extraction + lookup** — use an NLP model to pull clinical entities from text, then look those up. Better, but the extraction step inherits all the linguistic problems above. Negation, temporality, and implicit constructs regularly fool extraction models.

**Pure LLM** — ask the model to code directly. The most dangerous approach. The model has been trained on ICD-10-CM and the international version, not ICD-10-AM. It will produce codes that look right and are wrong — wrong ontology, wrong specificity, no awareness of ACS or CHI rules. And it will do this confidently.

**RAG (Retrieval-Augmented Generation)** — build a document from the code set and retrieve relevant context before generating. Still subject to all the linguistic failure modes. Hallucination doesn't disappear because you've added a retrieval step. And you can't RAG your way into knowing rules that weren't written down anywhere accessible.

**Hybrid approaches** — combinations of the above. Better in aggregate but still ceiling-limited by the underlying gaps. Combining imperfect methods doesn't produce a reliable system when the core limitations are about knowledge and reasoning, not just tooling.

---

## The Confidence Problem

This deserves its own section because it's the one that makes all the others worse.

LLMs don't say *I don't know.* They produce an answer. It looks like any other answer. There's no signal when the model is guessing versus when it's on solid ground.

In most software contexts, that's a quality problem. In medical coding, it's a liability.

A wrong code submitted to NPHIES or an insurance payer isn't just a data error. Depending on the nature of the error, it can be a rejected claim, an audit trigger, or a compliance exposure. The system failing loudly is manageable. The system failing silently — confidently producing the wrong code, claim submitted, damage done — is the failure mode you can't afford.

---

## What Reliable Coding Actually Requires

So what would a system need to get this right? Not implementation details — just the honest list of properties:

- **Native knowledge of ICD-10-AM** — not mapped from CM, not approximated from the international version. The actual code set, with its hierarchy and structure.
- **Awareness of ACS and CHI rules** — including the dynamic ones that vary by patient factors. These rules need to be represented explicitly, not inferred.
- **Clinical reasoning capability** — the ability to move from what a physician wrote to what they clinically meant, handling negation, temporality, and implicit constructs correctly.
- **Principal diagnosis sequencing** — knowing not just which codes apply but in what order, since sequencing affects DRG assignment and reimbursement.
- **Excludes logic** — ICD-10-AM has explicit rules about which codes cannot be used together (Excludes1) and which can (Excludes2). A valid coding output must respect these.
- **Deterministic, auditable output** — coding should produce the same result given the same clinical facts, every time. And a coder or auditor should be able to trace why a code was assigned.
- **Maintainability** — the code set and rules evolve. ICD-10-AM editions update. CHI rules change. A reliable system has to evolve with them, not degrade silently.

That's a specific and demanding set of requirements. No off-the-shelf LLM meets them.

---

## How Glance Approaches This

We built Glance's coding engine specifically for this problem — not as a general AI tool adapted for coding, but designed from the ground up for KSA clinical coding requirements.

The approach combines clinical reasoning, a proprietary knowledge graph that encodes ICD-10-AM structure and coding rules, and a hybrid architecture that handles the linguistic complexity of clinical notes while applying ACS and CHI rules correctly — including the dynamic, patient-specific ones.

The result is a system that produces auditable, rule-compliant code suggestions with a level of accuracy and consistency that general-purpose AI approaches haven't been able to match in this context.

We're not claiming to have solved a hard problem easily. We're claiming to have taken the hard problem seriously.

---

## The Right Question

The conversation around AI in medical coding tends to start with *"can LLMs do this?"* and point to impressive benchmark numbers as evidence.

That's the wrong question.

The right question is whether the properties of LLMs match the properties this specific problem requires. Accuracy under ambiguity. Knowledge of non-public, region-specific standards. Deterministic output. Rule-aware reasoning. Auditable results.

In KSA medical coding, they don't match. Not because LLMs aren't capable in general — they are. But because this problem needs something built for it, not something general that happens to be powerful.

The difference matters. And in a domain where wrong codes have real consequences, it matters a lot.