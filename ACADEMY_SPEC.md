# AEL Engineering Academy v1.0.0

> Product Specification — LLM Engineering Learning Path

## Overview

AEL Engineering Academy is the flagship educational product of the AEL Digital Learning Platform. It transforms interactive references into complete learning experiences.

**Version:** 1.0.0
**Scope:** LLM Engineering only
**Status:** Specification Phase

## Target User

### Primary Audience

- Software engineers who want to understand LLMs deeply
- Data scientists moving into LLM engineering
- AI researchers building production systems
- Developers building LLM-powered applications

### Prerequisites

- Basic programming knowledge (Python preferred)
- Understanding of APIs and HTTP
- Familiarity with command line
- No prior ML/AI experience required

## Curriculum Structure

### Module 1: Foundations (Weeks 1-3)

**Goal:** Understand what LLMs are and how they work.

#### Week 1: What are LLMs?

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain what an LLM is in simple terms
- ✓ Differentiate between LLM and traditional ML models
- ✓ Describe the training process (pre-training, fine-tuning)
- ✓ Set up a Python environment for LLM development
- ✓ Make a basic API call to an LLM

**Reference Coverage:** Architecture, Training, Inference

**Exercises:**
- Exercise 1.1: Explain LLM to a non-technical person
- Exercise 1.2: Compare different LLM providers
- Exercise 1.3: Set up API keys and make first call

**Challenge:** Build a text summarizer using API

#### Week 2: Transformer Architecture

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain the Transformer architecture
- ✓ Describe Self-Attention mechanism
- ✓ Explain Positional Encoding
- ✓ Describe Multi-Head Attention
- ✓ Compare Transformer vs RNN/LSTM

**Reference Coverage:** Attention, Self-Attention, Multi-Head

**Exercises:**
- Exercise 2.1: Visualize attention weights
- Exercise 2.2: Implement simple attention from scratch
- Exercise 2.3: Compare different attention patterns

**Challenge:** Implement a custom attention visualization

#### Week 3: Tokenization

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain why tokenization matters
- ✓ Describe BPE algorithm
- ✓ Compare different tokenization methods
- ✓ Implement a simple tokenizer
- ✓ Handle edge cases in tokenization

**Reference Coverage:** BPE, WordPiece, SentencePiece

**Exercises:**
- Exercise 3.1: Tokenize text with different methods
- Exercise 3.2: Count tokens for cost estimation
- Exercise 3.3: Handle special characters

**Challenge:** Create a domain-specific tokenizer

---

### Module 2: Core Techniques (Weeks 4-6)

**Goal:** Master the essential LLM engineering techniques.

#### Week 4: Prompt Engineering

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Design effective prompts for various tasks
- ✓ Apply Zero-shot, Few-shot, and Chain-of-Thought
- ✓ Use prompt templates and variables
- ✓ Evaluate prompt quality
- ✓ Optimize prompts for cost and quality

**Reference Coverage:** Zero-shot, Few-shot, Chain-of-Thought

**Exercises:**
- Exercise 4.1: Design prompts for different tasks
- Exercise 4.2: Compare prompt engineering strategies
- Exercise 4.3: Build a prompt testing framework

**Challenge:** Design a prompt engineering framework

#### Week 5: Fine-tuning

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain when fine-tuning is needed
- ✓ Describe LoRA and QLoRA
- ✓ Prepare training data
- ✓ Fine-tune a model for a specific task
- ✓ Evaluate fine-tuned model performance

**Reference Coverage:** LoRA, QLoRA, PEFT

**Exercises:**
- Exercise 5.1: Prepare a training dataset
- Exercise 5.2: Fine-tune a small model
- Exercise 5.3: Compare base vs fine-tuned model

**Challenge:** Fine-tune a model for classification

#### Week 6: RAG Architecture

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain RAG architecture
- ✓ Design a vector store schema
- ✓ Implement document chunking
- ✓ Build a basic RAG pipeline
- ✓ Add citation tracking

**Reference Coverage:** Retrieval, Vector Stores, Embeddings

**Exercises:**
- Exercise 6.1: Chunk documents for RAG
- Exercise 6.2: Implement semantic search
- Exercise 6.3: Add metadata filtering

**Challenge:** Build a RAG system with citation

---

### Module 3: Applied Engineering (Weeks 7-9)

**Goal:** Build real applications with LLMs.

#### Week 7: Agents & Tools

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain what agents are
- ✓ Design tool schemas
- ✓ Implement function calling
- ✓ Build a multi-step agent workflow
- ✓ Handle agent errors gracefully

**Reference Coverage:** Function Calling, Tool Use

**Exercises:**
- Exercise 7.1: Define tools for an agent
- Exercise 7.2: Implement tool routing
- Exercise 7.3: Handle tool errors

**Challenge:** Create an agent with tool use

#### Week 8: Evaluation

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Design evaluation frameworks
- ✓ Choose appropriate metrics
- ✓ Implement automated evaluation
- ✓ Conduct human evaluation
- ✓ Interpret evaluation results

**Reference Coverage:** Benchmarks, Metrics, Human Evaluation

**Exercises:**
- Exercise 8.1: Design evaluation criteria
- Exercise 8.2: Implement automated metrics
- Exercise 8.3: Build an evaluation dashboard

**Challenge:** Design an evaluation suite

#### Week 9: Deployment

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Design production APIs
- ✓ Implement rate limiting and caching
- ✓ Optimize for cost
- ✓ Monitor performance
- ✓ Handle scaling

**Reference Coverage:** APIs, Cost Optimization, Scaling

**Exercises:**
- Exercise 9.1: Design an API schema
- Exercise 9.2: Implement caching
- Exercise 9.3: Set up monitoring

**Challenge:** Deploy a production API

---

### Module 4: Production & Capstone (Weeks 10-12)

**Goal:** Build production-ready applications.

#### Week 10: Safety & Alignment

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Identify safety risks
- ✓ Implement input validation
- ✓ Design output guardrails
- ✓ Conduct red-teaming
- ✓ Apply ethical considerations

**Reference Coverage:** Guardrails, Red-teaming, Ethics

**Exercises:**
- Exercise 10.1: Identify attack vectors
- Exercise 10.2: Implement input filtering
- Exercise 10.3: Design output validation

**Challenge:** Implement safety guardrails

#### Week 11: Advanced Topics

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Explain multi-modal LLMs
- ✓ Describe reasoning techniques
- ✓ Implement planning strategies
- ✓ Compare different approaches
- ✓ Choose the right technique for the task

**Reference Coverage:** Multi-modal, Reasoning, Planning

**Exercises:**
- Exercise 11.1: Work with multi-modal inputs
- Exercise 11.2: Implement chain-of-thought
- Exercise 11.3: Design a planning system

**Challenge:** Build a multi-modal application

#### Week 12: Capstone Project

**Learning Outcomes:**
After completing this week, the learner can:

- ✓ Design a complete LLM application
- ✓ Implement all components
- ✓ Write documentation
- ✓ Create a demo
- ✓ Present the project

**Project Options (choose one):**

1. **RAG Knowledge Base**
   - Ingest documents
   - Vector search
   - Citation tracking
   - Web interface

2. **AI Writing Assistant**
   - Multiple writing styles
   - Grammar checking
   - Tone adjustment
   - Export to Markdown

3. **Code Review Agent**
   - Analyze pull requests
   - Suggest improvements
   - Security scanning
   - Integration with GitHub

4. **Customer Support Bot**
   - Intent classification
   - Response generation
   - Escalation logic
   - Analytics dashboard

**Requirements:**
- Working code on GitHub
- README with setup instructions
- Demo video (2-3 minutes)
- Architecture diagram
- Cost analysis
- Safety considerations

---

## Assessment

### Quiz (Per Week)

Each week includes a quiz:

```
Quiz Structure:
- 10 multiple choice questions
- 2 practical questions
- 1 essay question
- Passing score: 80%
- Time limit: 30 minutes
```

### Mock Interview (Week 12)

Simulated technical interview:

```
Interview Structure:
- 5 theoretical questions
- 2 coding challenges
- 1 system design question
- Duration: 45 minutes
- Passing score: 70%
```

### Timed Exam (Week 12)

Comprehensive exam:

```
Exam Structure:
- 50 multiple choice questions
- 5 practical questions
- 2 system design questions
- Time limit: 3 hours
- Passing score: 75%
```

## Certification

### Requirements

```
✓ Complete all 12 weeks
✓ Pass all weekly quizzes (80%+)
✓ Pass mock interview (70%+)
✓ Pass timed exam (75%+)
✓ Submit capstone project
✓ Capstone reviewed and approved
```

### Certificate

Digital certificate with:
- Learner name
- Completion date
- Path completed (LLM Engineering)
- Grade (Based on overall score)
- Verification URL
- QR code

## Portfolio

### Items

```
✓ GitHub repository with all projects
✓ README showcasing learning journey
✓ Demo videos for major projects
✓ Architecture diagrams
✓ Blog post about capstone project
✓ LinkedIn certificate sharing
```

### Template

Pre-built template for learners:
- GitHub profile README
- Project showcase page
- Resume section template
- Interview preparation guide

## Success Criteria

### Per Stage

| Stage | Success Metric | Target |
|-------|---------------|--------|
| Learn | Reference completion | 100% topics covered |
| Practice | Exercise completion | 90% exercises done |
| Build | Project submission | 100% projects submitted |
| Validate | Assessment pass rate | 80% average |
| Certify | Certification rate | 70% of enrolled |
| Portfolio | Portfolio creation | 60% of certified |

### Overall

```
Enrollment Rate: > 100 learners (target)
Completion Rate: > 70%
Learning Outcome: > 80% can build independently
Assessment Pass Rate: > 80%
Capstone Completion: > 70%
Portfolio Creation Rate: > 60%
Average Learning Time: < 120 hours
```

## Success Definition

> **Can a learner go from zero knowledge to building a real LLM engineering project using only the Academy?**

If yes, the product succeeds.

---

**Version:** 1.0.0
**Status:** Specification
**Author:** Ayman Elmasry — AEL Digital Studio
**License:** MIT
