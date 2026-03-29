# Cruxo

Cruxo is a decision-making app that uses AI to argue both sides of a choice, force a user to commit on each argument, and surface the crux behind the decision.

Live app: https://cruxo.vercel.app

## What It Does

- Takes one concrete decision prompt from the user
- Generates 8 argument cards across multiple categories
- Lets the user sort each card into `Challenge` or `Support`
- Injects pushback during the session when the flow detects a directional lean
- Produces a compact result with:
  - `Blind Spot`
  - `The Crux`
  - `Next Step`

## Stack

- Next.js 15
- React 19
- Tailwind CSS 4
- Framer Motion
- `@use-gesture/react`
- Vercel AI SDK
- Amazon Bedrock via `@ai-sdk/amazon-bedrock`
- `@chenglou/pretext` for fast text fitting

## Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Add your own AWS credentials

Create a local env file from the example:

```bash
cp .env.example .env.local
```

Then fill in your own Amazon Bedrock credentials in `.env.local`.

Required variables:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Optional:

- `AWS_SESSION_TOKEN`

Cruxo does not ship with shared credentials. You need to bring your own AWS account with Bedrock access.

### 3. Start the app

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Notes

- `.env.local` is ignored by git and should never be committed.
- `.env.example` is safe to commit because it only contains placeholders.
- The app currently uses the standard AWS env variable names expected by the Bedrock provider.

## Project Status

This is an MVP.

Current behavior:

- card generation is prompt-driven
- pushback is heuristic-driven
- final analysis is a compact LLM summary

What is still rough:

- pushback/result logic should become more evidence-backed
- decision analytics need stronger scoring than simple directional lean
- feedback capture exists in the UI conceptually but is not yet a full closed-loop system

## Open Source

This repo is licensed under the MIT License. See [LICENSE](./LICENSE).

## Credits

- Andrej Karpathy for the prompt that exposed the product gap
- Cheng Lou for `@chenglou/pretext`
