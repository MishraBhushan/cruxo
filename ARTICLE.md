# I Built Cruxo in 24 Hours Because Karpathy Demolished His Own Argument — and Chenglou Gave Me the UI to Do It

## The Two Tweets That Started This

On March 28, 2026, two tweets went viral within hours of each other.

**Andrej Karpathy** (2.3M views):

> - Drafted a blog post
> - Used an LLM to meticulously improve the argument over 4 hours.
> - Wow, feeling great, it's so convincing!
> - Fun idea let's ask it to argue the opposite.
> - LLM demolishes the entire argument and convinces me that the opposite is in fact true.
> - lol
>
> The LLMs may elicit an opinion when asked but are extremely competent in arguing almost any direction. This is actually super useful as a tool for forming your own opinions, just make sure to ask different directions and be careful with the sycophancy.

**Cheng Lou** (9.6M views):

> My dear front-end developers: I have crawled through depths of hell to bring you, for the foreseeable years, one of the more important foundational pieces of UI engineering: **Fast, accurate and comprehensive userland text measurement algorithm in pure TypeScript**, usable for laying out entire web pages without CSS, bypassing DOM measurements and reflow.

One tweet exposed the problem. The other gave me the tool to solve it. I built Cruxo the next day.

## The Problem Karpathy Exposed

LLMs are **rhetoric engines, not truth engines**. They're equally convincing arguing for or against any position. This is a devastating bug in a chatbot — and a killer feature in a decision-making tool.

The replies to Karpathy's tweet said it all:

- Alex Lieberman: *"There's no excuse anymore to not steelman the other side of an argument ahead of time. Virtually zero friction to play out all sides."*
- nihal: *"The sycophancy is what's annoying. C'mon AI no need to kiss up."*

Everyone agreed: LLMs should argue back. But nobody had built the product.

## Why Chat Is the Wrong Interface

You *can* type "argue both sides of my decision" into ChatGPT. Millions of people do. Here's why it doesn't work:

**Chat is passive.** You read arguments. You nod. You move on. You haven't actually engaged with any of them.

**Chat is sycophantic.** The AI hedges everything. "On one hand... on the other hand..." Nothing lands with force.

**Chat has no memory of your reasoning.** It doesn't know which arguments you dismissed, which you lingered on, or what pattern your thinking reveals.

The insight behind Cruxo: **the interaction model matters more than the model quality.** Forcing someone to physically sort each argument — swipe left for "challenge," right for "support" — changes how they think. You can't just skim. You have to commit.

## What Pretext Made Possible

Cheng Lou's `@chenglou/pretext` library dropped the same day. Pure-arithmetic text measurement at ~0.0002ms per layout call. 60fps text reflow without touching the DOM.

This matters for Cruxo because:

1. **Cards need to fit any text.** Argument cards have variable-length text. Pretext's `AutoFitText` binary-searches the largest font size that fits the card container — no layout shift, no janky resize.

2. **Swipe animations need 60fps.** During a swipe gesture, the card's visible width changes every frame. DOM measurement during touch events causes visible jank. Pretext doesn't touch the DOM.

3. **One-viewport rule.** Every screen in Cruxo must fit a single viewport — no scrolling. This is only possible when you can predict text heights in advance and size containers accordingly.

Without Pretext, Cruxo would feel like a web app. With it, it feels native.

## What I Actually Built (In 24 Hours)

**Cruxo** — "The app that argues back."

The flow:

1. **Type your decision.** "Should I raise VC funding or bootstrap?"
2. **AI generates 8 argument cards.** Neutral phrasing, diverse categories (financial, emotional, practical, career, health, legal). All placed in the center — no anchoring bias.
3. **Swipe to sort.** Left = challenge. Right = support. You must commit on every card.
4. **AI pushes back.** After card 4, Cruxo analyzes your sorting pattern and interrupts: *"You've completely ignored every challenge to your position. That's not thoughtful — it's biased self-delusion."* Then it generates a counter-argument you haven't seen.
5. **Second pushback at card 8.** Stronger this time.
6. **Results.** Three things in one viewport:
   - **Blind Spot** — what you're ignoring (one sentence)
   - **The Crux** — the ONE factual question that determines which side is right
   - **Next Step** — one concrete action to resolve the crux

The AI personality is **brutally opinionated** by design. It will tell you "Your sorting reveals you've already decided — you're just looking for permission." No hedging. No "that's an interesting perspective." This is the anti-sycophancy product.

## The Stack

- **Next.js 15** + React 19 + Tailwind CSS
- **@chenglou/pretext** — AutoFitText for cards, height prediction
- **Framer Motion** + @use-gesture/react — swipe physics
- **Vercel AI SDK** + Amazon Bedrock Nova 2 Lite — near-zero cost per decision
- **Vercel** for deployment

Total cost per decision: ~$0.0004. Free tier is sustainable.

## The Competitive Landscape (It's All Developer Tools)

I researched 7 existing dialectical AI projects before building:

| Project | What | Why Cruxo is different |
|---------|------|----------------------|
| **Hegelion** | Python framework, thesis/antithesis/synthesis | CLI, no UI |
| **Quorum** | Multi-agent debate with mandatory dissent | Claude Code skill, not consumer |
| **Miessler's Council** | Toulmin + Socratic + Hegelian engine | Prompt tool for power users |
| **Dialectic Digest** | Headlines through 2-round debate | CLI, output-only |
| **Dialexity** | Dialectical reasoning platform | Enterprise/prosumer, form-based |
| **Rationale (Jina AI)** | Generates pros/cons | Static list, no interaction |
| **Kialo** | Pre-AI debate trees | Not AI-native |

Every single one builds a **reasoning engine**. Nobody builds the **consumer experience**. The gap is between "powerful dialectical AI" and "an app a normal person would open on their phone." Cruxo fills that gap.

## What I Stole (With Attribution)

- **Separate LLM calls** (from Hegelion) — each phase gets its own API call so the model can't hedge within a single response
- **Iterative rebuttal** (from Dialectic Digest + Karpathy's loop) — pushback happens twice, getting stronger each time
- **Mandatory counter-proposals** (from Quorum) — the AI doesn't just disagree, it proposes alternatives
- **"Unanimous = more scrutiny"** (from Quorum) — if you sort all cards one direction, pushback intensity increases

## The Design Rule That Makes It Work

**Every page fits one viewport. No scroll.**

This forces discipline: the AI must say what matters in one sentence. The design must fill available space, not overflow it. Text adapts to the container via Pretext, not the other way around.

This is the true test of editorial design: if content doesn't fit, the design is wrong — not the viewport.

## Try It

**Live**: [cruxo.vercel.app](https://cruxo.vercel.app)
**Source**: [github.com/MishraBhushan/cruxo](https://github.com/MishraBhushan/cruxo) (MIT)

Built in 24 hours with Claude Code. The conversation where we designed and built everything is the most interesting pair-programming session I've had — from Karpathy's tweet to a shipped product in one sitting.

## What's Next

- **BYOK** — bring your own API key (OpenAI, Anthropic) for stronger arguments
- **Decision journal** — revisit decisions months later: "what was the crux? what actually happened?"
- **"User argues, AI attacks"** mode — you bring your position and data, AI stress-tests it
- **Share** — screenshot-optimized results you can send to your co-founder

The moat isn't the AI. It's the interaction model. Swipe forces commitment. Commitment changes thinking. That's the product.

---

*Inspired by [@karpathy](https://x.com/karpathy/status/2037921699824607591) and [@_chenglou](https://x.com/_chenglou/status/2037713766205608234). Built with [Claude Code](https://claude.ai/claude-code).*
