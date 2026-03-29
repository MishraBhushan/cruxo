const REQUIRED_BEDROCK_ENV_VARS = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

export function assertBedrockEnv(): void {
  const missing = REQUIRED_BEDROCK_ENV_VARS.filter(
    (name) => !process.env[name]
  );

  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `Missing required Bedrock environment variables: ${missing.join(", ")}`
  );
}
