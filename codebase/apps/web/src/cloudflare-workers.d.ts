interface HyperdriveBinding {
  connectionString: string
}

declare module 'cloudflare:workers' {
  export const env: {
    HYPERDRIVE?: HyperdriveBinding
    PUBLIC_CLERK_PUBLISHABLE_KEY?: string
    CLERK_SECRET_KEY?: string
  }
}
