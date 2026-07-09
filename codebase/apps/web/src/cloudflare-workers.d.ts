interface HyperdriveBinding {
  connectionString: string
}

declare module 'cloudflare:workers' {
  export const env: {
    HYPERDRIVE?: HyperdriveBinding
  }
}
