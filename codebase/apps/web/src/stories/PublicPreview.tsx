/** Actual prerendered Astro components, with navigation disabled inside the frame. */
export function PublicPreview({ name, title }: { name: string; title: string }) {
  return <iframe title={title} src={`/_storybook/previews/${name}/`}
    sandbox="allow-same-origin"
    onLoad={(event) => {
      // Sandboxing blocks scripts/forms, but ordinary anchors still navigate.
      // Remove their destinations rather than installing script handlers into
      // a script-disabled document. Keep the production appearance intact.
      const links = event.currentTarget.contentDocument?.querySelectorAll('a[href]')
      links?.forEach((link) => {
        link.removeAttribute('href')
        link.setAttribute('role', 'link')
        link.setAttribute('aria-disabled', 'true')
      })
    }}
    style={{ display: 'block', width: '100%', height: '100vh', border: 0, background: 'var(--c-canvas)' }} />
}
