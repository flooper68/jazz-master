import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, Button, Card, Checkbox, Radio } from '../components/ui/Primitives'
import { Select } from '../components/ui/Select'

const swatches: Record<string, readonly [name: string, className: string, note: string][]> = {
  Surfaces: [
    ['canvas', 'bg-canvas', 'page background'],
    ['panel', 'bg-panel', 'cards, sidebar, white sections'],
    ['panel-2', 'bg-panel-2', 'insets, active nav, tracks'],
    ['field', 'bg-field', 'inputs'],
    ['mock', 'bg-mock', 'dark product mocks inside cards'],
  ],
  Text: [
    ['fg', 'bg-fg', 'headings, body'],
    ['fg-2', 'bg-fg-2', 'secondary copy'],
    ['muted', 'bg-muted', 'captions, metadata'],
    ['accent-text', 'bg-accent-text', 'links, highlights'],
  ],
  Lines: [
    ['line', 'bg-line', 'dividers, card borders'],
    ['line-strong', 'bg-line-strong', 'input borders, secondary buttons'],
  ],
  Actions: [
    ['cta', 'bg-cta', 'primary buttons'],
    ['cta-hover', 'bg-cta-hover', ''],
    ['accent', 'bg-accent', 'orange — brand accent'],
    ['blue', 'bg-blue', 'brand pastel'],
    ['lilac', 'bg-lilac', 'brand pastel'],
  ],
  Status: [
    ['success', 'bg-success', 'record, got it'],
    ['success-soft', 'bg-success-soft', 'grade chip'],
    ['warning-soft', 'bg-warning-soft', 'shaky'],
    ['danger', 'bg-danger', 'errors'],
    ['danger-soft', 'bg-danger-soft', 'missed'],
  ],
}

function ThemePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 py-6">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Foundations</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-[-0.03em]">Woodshed theme</h1>
        <p className="mt-4 max-w-2xl text-lg text-fg-2">
          Off-white canvas, white panels, black pill CTAs, three pastel brand colours, and a tight grotesk for headlines.
          Every value is a <code className="rounded bg-panel-2 px-1 py-0.5 text-sm">--c-*</code> custom property in
          <code className="rounded bg-panel-2 px-1 py-0.5 text-sm"> src/index.css</code>, exposed as Tailwind utilities via
          <code className="rounded bg-panel-2 px-1 py-0.5 text-sm"> @theme inline</code>. Use the toolbar to flip light / dark.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Colour</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {Object.entries(swatches).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-sm font-medium text-muted">{group}</h3>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
                {items.map(([name, className, note]) => (
                  <li key={name} className="flex items-center gap-4 p-3">
                    <span className={`h-10 w-14 shrink-0 rounded-lg border border-line ${className}`} />
                    <span className="min-w-0 flex-1">
                      <code className="text-sm font-medium">{name}</code>
                      {note && <span className="block truncate text-xs text-muted">{note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Type</h2>
        <div className="mt-6 space-y-5 rounded-2xl border border-line bg-panel p-6">
          <p className="font-display text-6xl font-bold tracking-[-0.03em]">Smart practice, made easy</p>
          <p className="font-display text-3xl font-bold tracking-tight">Deciding what to practise is half the work.</p>
          <p className="text-xl text-fg-2">Body large — Inter 20px, secondary colour for lead paragraphs.</p>
          <p className="text-base">Body — Inter 16px, foreground colour for readable content.</p>
          <p className="text-sm text-muted">Caption — Inter 14px, muted for metadata and helper text.</p>
          <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Eyebrow — 12px, letter-spaced</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Shape</h2>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          {[
            ['rounded-lg', 'inputs, chips'],
            ['rounded-xl', 'buttons'],
            ['rounded-2xl', 'cards, panels'],
            ['rounded-[28px]', 'hero cards'],
            ['rounded-full', 'badges, avatars'],
          ].map(([radius, use]) => (
            <div key={radius} className="text-center">
              <div className={`h-20 w-24 border border-line bg-panel-2 ${radius}`} />
              <code className="mt-2 block text-xs">{radius}</code>
              <span className="text-xs text-muted">{use}</span>
            </div>
          ))}
          <div className="text-center">
            <div className="flex gap-3">
              <span className="h-16 w-16 rotate-12 rounded-[42%] bg-accent" />
              <span className="h-16 w-14 -rotate-12 rounded-[38%] bg-blue" />
              <span className="h-14 w-18 rotate-[20deg] rounded-[40%] bg-lilac" />
            </div>
            <span className="mt-2 block text-xs text-muted">floating shapes</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Primitives</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-sm font-medium text-muted">Buttons</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button>Start practising</Button>
              <Button variant="secondary">Back to exercises</Button>
              <Button variant="quiet">Skip for now</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-muted">Badges &amp; chips</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge>Incomplete</Badge>
              <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success-text">Got it</span>
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning-text">Shaky</span>
              <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger-text">Missed</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-muted">Fields</h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <Select options={[{ value: 'all', label: 'All time' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }]} value="all" onChange={() => {}} aria-label="Period" />
              <label className="flex items-center gap-2"><Radio name="theme-demo" defaultChecked /> Beginner</label>
              <label className="flex items-center gap-2"><Radio name="theme-demo" /> Intermediate</label>
              <label className="flex items-center gap-2"><Checkbox defaultChecked /> Chords &amp; voicings</label>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-muted">Card</h3>
            <p className="mt-3 text-sm text-fg-2">White panel on the off-white canvas, hairline border, 16px radius, 20px padding.</p>
          </Card>
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundations/Theme',
  component: ThemePage,
  parameters: { layout: 'padded', docs: { description: { component: 'The Woodshed design tokens, type, shapes and primitives in one place. Light and dark via the toolbar.' } } },
} satisfies Meta<typeof ThemePage>
export default meta
export const Theme: StoryObj<typeof meta> = {}
