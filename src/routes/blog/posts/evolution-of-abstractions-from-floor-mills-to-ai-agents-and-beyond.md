---
title: "Evolution of Abstractions: From Flour Mills to AI Agents and Beyond"
date: 2026-01-11
excerpt: How social media went from a tool for connection to a force that divides us.
category: Technology
---

Humans have been trying to automate tasks for centuries. From the Industrial Revolution to the modern AI era, we’ve been inventing clever ways to make machines do what humans used to. Abstraction was one of the factor that accelerated our journey towards the automation.

Take a fun historical tidbit: the **first significant industrial automation** was an automatic flour mill developed by **Oliver Evans in 1785**.

![First significant industrial automation: Automatic flour mill developed by Oliver Evans in 1785](/src/lib/images/blogs/Oliver_Evans_-_Automated_mill.jpg)

_Image Source: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Oliver_Evans_-_Automated_mill.jpg)_

This guy essentially told a machine: “You handle the grinding; I’ll have a coffee and watch.” And thus began a centuries-long obsession with outsourcing repetitive work to machines. Once we found a solution for our physical labour, we started thinking how to automate our cognitive labour. By the 20th century, we built mechanical computers, that **uses physical components like gears, levers, and linkages to perform calculations. Analytical Engine [sn: Remember Charles Babbage from your computer science textbooks!!] was the first of them.**

Turing machine [sn: Invented by Alan Turing & a product of WWII] was **a simple, abstract model of computation**, featuring an infinite tape, a read/write head, and a set of rules to manipulate symbols, capable of simulating any computer algorithm, thus defining the limits of what is computable and forming the bedrock of theoretical computer science.

Fast forward a couple hundred years, and electronics arrived. We got ENIAC, **the first programmable, general-purpose electronic digital computer. It was programmed by manually rewiring, plugging and unplugging, hence routing electrons through different channels to hit the desired outcome. [sn: Yet another WWII product].** Suddenly, a **single machine could be taught to perform many different tasks** simply by changing its instructions — no physical rewiring required. This was the birth of **programmable machines**, and it sparked the software journey. Now, instead of building a new machine for every task, we just write programs and reuse the same hardware in countless ways.

---

## The Dawn of Software Abstractions

The process of creating softwares went through multiple stages of evolution so far, each one of them iterating the precursors, Major breakthroughs were:

1. **Assembly Languages**: Replaced wiring and switches with symbols representing machine operations. We had to think from the hardware level to write each line, where each bit is and where to move, etc.
2. **High-Level Languages**: FORTRAN, COBOL, and C replaced assembly, allowing humans to think about logic, not bits and electrons.
3. **Frameworks & Libraries**: Standardized solutions made building applications faster, scalable, and slightly less soul-crushing (A big thanks to the Open source movements and communities).

Old abstractions became **commodities**: reusable, widely understood, and often taken for granted. Today, we build **on top of commodities**, letting developers focus on innovation rather than reinventing the wheel. For example, HTTP servers, database connectors, even infrastructure (Hyperscalers) are now commodities that programmers leverage to build higher-level systems.

---

## Enter the Age of AI: LLMs as the New Abstraction Layer

Now we arrive at **Large Language Models (LLMs)** — arguably the newest layer of abstraction. LLMs have generalized knowledge, reasoning, and code-generation capabilities, allowing humans to **leverage knowledge itself as a programmable medium**.

### What They Do:

- Write code, generate documentation, and produce insights from massive datasets.
- Summarize, plan, reason, and occasionally provide advice with an air of human flair.
- Act as AI agents capable of multi-step workflows.

### Vibe Coding

A modern developer trend is **vibe coding [sn: coined by the OG: Karpathy]**:

> Vibe coding is an AI-driven software development approach where developers use natural language prompts (like describing a "vibe") to have LLMs generate code, enabling rapid prototyping and building apps by focusing on _what to build_ rather than _how to write every line_

Think of it as telling your AI co-pilot: _“I want a dreamy, pastel-themed task manager that reminds people to drink water,”_ and watching it spin up working code in minutes. “It’s magical”

---

## LLM Limitations: Performance, Reliability, and Compute Demands

For programmers, routine coding is increasingly automated. LLMs enable rapid prototyping (vibe coding) and productivity boosts. Right now, we are in a transitional period of this evolution cycle, and there is a lot of uncertainty, lack of clarity about the profession of software engineering in general. mainly due to the surge of all the Coding agents (Claude, Codex, etc) and how good it has become.

While LLMs are incredibly powerful, they **cannot yet replace all forms of software or knowledge work**, particularly where **determinism, reliability, or high performance** are critical:

1. **Performance and Compute Requirements**

   State-of-the-art models require GPUs, TPUs, or massive cloud clusters. Running them at scale is super expensive(economically and environmentally), slow, or infeasible for certain real-time applications (Example: autonomous vehicles or embedded medical devices).

2. **Hallucinations and Probabilistic Outputs**

   LLMs generate probabilistic results — sometimes plausible but factually incorrect. In regulated domains like healthcare or finance, even a small hallucination can be catastrophic.

3. **Task Suitability**

   Not all tasks are text-heavy or reasoning-based. Real-time control, vision-based systems, or low-latency automation often require **specialized models or deterministic algorithms**.

4. **Reduced inventions:**

   While LLM helps to put down a huge amount of code pretty quickly, the developers will lose the appetite and awareness to make the code computationally and functionally efficient. As LLM can only generate versions of codes that it was trained on, we will lose to find novel approaches that push boundaries.

5. **Context limits and scale**:

   For large scale projects that has hundreds and thousands of lines of codes, The LLM context size limit (the amount of stuff it can keep in memory at a given point of time to generate stuff) is a real bummer. For generating a piece of code within a project this scale, the LLM doesn’t have to hold the whole project in context, but LLM have and wont have any idea on the architecture, the components, how the components interact with each other, internal and external depending factors, and so many and many small and big elements and informations that influence the project, that are not necessarily written down within the code itself. This will lead to duplications of codes, breaking dependancies and test cases.

6. **Mismatching outcome:**

   There are innumerable libraries and packages are available for the common programming languages and each one of them comes with many many versions of them. each one usually (but not necessarily) iterate their API and logics with each version, some functions gets depreciated, some gets added, some gets modified, some the whole library changes (The AngularJS 2.0, I hate you Angular for this). The point is, it has no idea, no idea that these are packages, there are different versions and there are different ways to do as per versions. so we end up with bunch of codes mishmashes from all over the place that at the end does not work. I’m not saying this happens all the time but it definitely happens hell of a lot of times.

---

## Navigating the Evolutionary Cycle

Considering all these, yet we have to accept the reality that LLM models can affect the knowledge workers in good ways and bad ways. We have to expect the AI agents will replace programmers doing repetitive boilerplate, analysts writing standard reports, and anyone in domains where outputs can have some randomness (amateur creative writers, graphic designers, proof readers, social media warriors, etc.).

It is true that there are companies cutting down their workforce expecting AI can replace them with cheaper cost. Yes they are cutting cost at the future expense. The business model these AI companies pushing helped to democratize [sn: But I would like to quote Osho on this. “Democracy basically means: **_Government by the people, of the people, for the people_**.... but the people are retarded. “] these AI capabilities such as anyone can write a novel that sound like Shakespeare now, anyone can generate Ghibli style arts, etc, leading to perceived depreciation of the real craft. But the ghost is already out of bottle now.

---

Looking back, each abstraction cycle:

1. **Obsoletes prior expertise**
2. **Makes knowledge or tools a commodity**
3. **Enables humans to build higher-order solutions**

Assembly programming became a commodity when high-level languages emerged. Routine report-writing, bookkeeping, and some coding jobs became susceptible to automation. Today, LLMs threaten routine knowledge work across engineering, operations and creative industries.

But, for the software engineers, LLM evolution opens up doors to build new kind of platforms, marketplaces, eco systems, different types of abstraction layers. We still need a really good number of "traditional" programmers to do those. The experts amongst us still have to work on safety-critical systems, precision systems where deterministic output is key (healthcare, finance where randomness leads to catastrophes). Some new disciplines emerged from this evolution are:

- Developers orchestrating hybrid AI systems
- Engineers combining domain knowledge with AI capabilities
- Platform builders who abstract different layers of AI apps. (Like mem0 for memory management)
- The wizards who actually train and optimize these LLM models.
- Prompt Engineers, who… oh sorry, you are not an engineer. Please don’t call yourself an engineer, ever.

---

For those who are worried about their career in this “vibe coding” era, understand that new layers of abstractions will emerge, there will be still more evolutions happening, maybe we will have neural interfaces that will take over all kind of human to computer interaction. (Sorry UI & UX guys), maybe a fully autonomous self iterating AI networks, even AGI (I’m a big skeptic though) in the future. There is no point in holding back or criticizing. add LLM as a weapon to your arsenal. learn how you can make use of it responsibly. And remember, None of those AI agents know what the hell is “code maintainability”.

So my fellow programmers, As an engineer and someone who leads technical wing of an organization, my advice is: if you are an experienced developer, use LLM, but consider is as an autocompletion, use it how ever you want it on your hobby projects and proof of concepts, but use sparingly on a production code, even then read it twice before pushing. and for the beginners, don’t you dare “vibe code” it if you want to build your craft

---

PS: I wrote this by end of 2025. If you are reading this in 2030 and thinking how stupid this guy is, please don't.

---