const requiredClerkEnvVars = [
  'PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const

export type RequiredClerkEnvVar = (typeof requiredClerkEnvVars)[number]

type RuntimeEnv = Record<string, unknown>

export interface ClerkRuntimeEnvSources {
  cloudflareEnv?: RuntimeEnv
  metaEnv?: RuntimeEnv
  processEnv?: RuntimeEnv
}

function readEnvValue(sources: ClerkRuntimeEnvSources, name: RequiredClerkEnvVar) {
  const value =
    sources.cloudflareEnv?.[name] ??
    sources.processEnv?.[name] ??
    sources.metaEnv?.[name]

  return typeof value === 'string' ? value : undefined
}

export function getMissingClerkRuntimeEnv(
  sources: ClerkRuntimeEnvSources,
): RequiredClerkEnvVar[] {
  return requiredClerkEnvVars.filter((name) => !readEnvValue(sources, name))
}

export function hasClerkRuntimeEnv(sources: ClerkRuntimeEnvSources) {
  return getMissingClerkRuntimeEnv(sources).length === 0
}

export function assertClerkRuntimeEnv(sources: ClerkRuntimeEnvSources) {
  const missing = getMissingClerkRuntimeEnv(sources)

  if (missing.length > 0) {
    throw new Error(
      `Jazz Master Clerk auth is not configured. Set ${missing.join(
        ', ',
      )} before starting the web app.`,
    )
  }
}
