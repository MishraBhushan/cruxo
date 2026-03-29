# X Thread Draft — Cruxo Launch

## Tweet 1 (Hook)
Yesterday @karpathy spent 4 hours perfecting an argument with an LLM, then asked it to argue the opposite. It demolished everything.

Today I shipped the product that turns this into a feature.

Meet Cruxo — the app that argues back.

cruxo.vercel.app

🧵

## Tweet 2 (The problem)
@karpathy exposed something important: LLMs are rhetoric engines, not truth engines. They're equally convincing in any direction.

That's a bug in a chatbot.

It's the core feature in a decision-making tool.

## Tweet 3 (Why not chat)
"Just ask ChatGPT for both sides" — sure, but:

- Chat is passive. You read, you nod, you move on
- Chat hedges everything ("on one hand...")
- Chat doesn't track which arguments you dismissed in 2 seconds

Cruxo makes you COMMIT on every argument. Swipe left = challenge. Right = support.

## Tweet 4 (The pushback — with screenshot)
After card 4, Cruxo interrupts:

"You've completely ignored every challenge to your position. That's not thoughtful — it's biased self-delusion."

Then it generates a counter-argument you haven't seen.

This happens TWICE. The second pushback is stronger.

[screenshot of pushback screen]

## Tweet 5 (The crux)
The killer feature: after sorting, Cruxo doesn't give you 20 arguments.

It gives you ONE sentence:

"This decision hinges on whether you can get a work visa within 12 months."

That's the crux. The one factual question that determines which side is right.

## Tweet 6 (Pretext — @_chenglou credit)
The UI magic is powered by @_chenglou's Pretext, which dropped THE SAME DAY as Karpathy's tweet.

Pure-arithmetic text layout at 60fps. No DOM reflow.

Every screen in Cruxo fits one viewport. No scroll. Text auto-sizes to fill available space. Pretext makes this possible.

## Tweet 7 (The stack)
Built in 24 hours with @ClaudeCode:

- Next.js 15 + React 19
- @chenglou/pretext (text layout)
- Framer Motion (swipe physics)
- Vercel AI SDK + Bedrock Nova 2 Lite
- Cost per decision: $0.0004

Open source (MIT): github.com/MishraBhushan/cruxo

## Tweet 8 (The insight)
Everyone in the dialectical AI space builds reasoning ENGINES (Hegelion, Quorum, Dialexity).

Nobody builds consumer UX.

The moat isn't the AI model. It's the interaction model.

Swipe forces commitment.
Commitment changes thinking.
That's the product.

## Tweet 9 (CTA)
Try it: cruxo.vercel.app
Source: github.com/MishraBhushan/cruxo

Type a decision you're wrestling with.
Sort the arguments.
See what you're ignoring.

Inspired by @karpathy and @_chenglou. Built with @ClaudeCode.
