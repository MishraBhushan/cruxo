# Cruxo

Cruxo is a decision-making web app designed to fight sycophancy. It helps users
think through hard choices by generating sharp, uncomfortable pushback rather
than telling them what they want to hear.

**Stack:** Next.js 15 (App Router) + AWS Bedrock (Nova Lite 2) + Tailwind CSS 4
**Deploys:** Vercel (auto-deploy on push to `main`)

## Local development

```bash
npm install
npm run dev          # starts Next.js on localhost:3000
```

You need a `.env.local` with AWS Bedrock credentials to use AI features locally.

## Testing prompts

The prompt test harness exercises the full pipeline (cards, pushback, results)
against real-world questions and scores quality. It requires AWS credentials.

```bash
npx tsx scripts/test-prompts.ts
```

Test output files (`scripts/test-results-*.json`) are git-ignored.

## Rules

1. **Always run `npm run build` before pushing.** The CI will catch failures,
   but catching them locally saves time.
2. **Run `npm run lint` before pushing.** Same reasoning.
3. **Never commit `.env.local` or any file containing secrets.**
4. **Never push to `main` without testing.** At minimum, verify the build passes.
5. **Run the prompt test** (`npx tsx scripts/test-prompts.ts`) after any change
   to prompts or AI-related code. This requires AWS credentials and is not part
   of CI.

## Branch strategy

- `main` deploys to Vercel automatically. Keep it green.
- Use feature branches for non-trivial changes and open a PR.
- Trivial fixes (typos, config) can go directly to `main` if the build passes.
