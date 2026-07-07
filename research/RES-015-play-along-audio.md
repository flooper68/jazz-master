---
id: RES-015
title: Sampled-instrument playback for play-along
status: complete
task: TASK-045
created: 2026-07-07
stale_when: "A chosen playback library changes licensing/maintenance posture, browser AudioContext scheduling behavior changes materially, or better freely licensed compact guitar/piano sample sets become available."
---

# RES-015 — Sampled-instrument playback for play-along

## Research questions

1. What freely licensable sampled guitar sources can cover a guitar-friendly
   two-octave practice range with acceptable timbre and asset size, and what
   piano fallback sources are credible if guitar loses on quality-per-megabyte?
2. For this app's narrow use case (short monophonic exercise lines plus click),
   should playback use `smplr`, `soundfont-player` / SoundFont2 loading,
   Tone.js `Sampler`, or a hand-rolled WebAudio sampler?
3. What scheduling pattern keeps looped notes and a metronome click accurate
   across arbitrary BPM changes and count-in behavior in current browsers?
4. How should samples and playback code be loaded and cached so non-playing
   views pay nothing and the app works offline after first use?
5. Which parts of the play-along scheduler/metronome should be designed as
   reusable infrastructure for EPIC-010's future recording count-in?

## Findings

### 1. Sample sources: guitar is viable at v1 weight, but use a fallback seam

**Best v1 guitar source: General MIDI electric/jazz guitar samples from the
FluidR3_GM or MusyngKite sets exposed by `midi-js-soundfonts`.** The
`gleitz/midi-js-soundfonts` project publishes browser-fetchable, pre-rendered
General MIDI soundfonts and documents four source banks; FluidR3_GM is generated
from a 148 MB uncompressed SF2 and released under CC-BY-3.0, while MusyngKite is
larger (1.75 GB uncompressed source) and CC-BY-SA-3.0 [1]. The actual web assets
are per-note MP3 directories for instruments such as
`electric_guitar_jazz-mp3`, `acoustic_guitar_nylon-mp3`, and
`acoustic_guitar_steel-mp3` [2]. This matters for Jazz Master because we can
load only the exercise range instead of shipping a whole bank.

**Measured asset weight is acceptable.** Header-only checks against exact raw
GitHub MP3 URLs on 2026-07-07 showed individual guitar samples in the practice
range at roughly 15-24 KB each [20]. The measured `Content-Length` values were:
MusyngKite nylon E3/E5 15,185/15,289 bytes; FluidR3 nylon E3/E5 16,745/15,861
bytes; FluidR3 electric jazz E3/E5 17,941/23,635 bytes. This is a
project-run measurement, not a second published source; treat it as a
single-source operational measurement. Combined with the published per-note
directories [2], it is enough to size v1: a chromatic E3-E5 window is 25 notes,
so a one-velocity two-octave guitar set is roughly 0.4-0.6 MB before cache
metadata. Loading a full note directory is still roughly low-single-digit MB,
but the narrow range keeps v1 honest.

**Licensing choice.** Prefer FluidR3_GM first because CC-BY-3.0 is easier for an
app asset than MusyngKite/FatBoy's CC-BY-SA-3.0 [1]. CC-BY still requires
attribution in the app/repo. If the dogfood timbre is unacceptable, MusyngKite
can be evaluated despite share-alike friction, or piano can be used as the
explicit fallback.

**Piano fallback.** `smplr` includes `SplendidGrandPiano`, described as a
sampled Steinway with four velocity groups, and it supports loading a subset of
notes via `notesToLoad` [3]. The piano fallback wins on musical clarity and
sample-library maturity but loses the owner's "sounds like the instrument in my
hands" preference. Keep it as a runtime/config fallback, not the default.

**Rejected for v1: raw VCSL guitar.** Versilian Community Sample Library is CC0
and excellent licensing-wise, but its visible chordophone folders are broader
sample-library material rather than a ready jazz-guitar playable instrument
mapping [4][5]. Using it directly would move v1 into SFZ/SF2 authoring. It stays
a later replacement candidate, especially if a clean guitar SFZ appears.

### 2. Playback library: use `smplr` for samples, own the app scheduler

**`smplr` is the best fit.** It is a MIT-licensed Web Audio sampler package
(`1.0.0` latest on npm, published 2026-06-13; GitHub API showed the repo pushed
2026-06-13, updated 2026-06-26, and 0 open issues on access) [6][7]. Its docs
cover built-in `Soundfont`, `Sampler`, and `SplendidGrandPiano` instruments,
scheduled note starts in `AudioContext.currentTime` seconds, load progress,
shared loaders, configurable schedulers, `CacheStorage`, and a modern Soundfont
wrapper over Benjamin Gleitzman's pre-rendered soundfonts [3][8][9][10]. The
maintenance signal is strong enough for this scoped use: recent 1.0 release,
MIT license, small issue queue, and a narrow seam that lets us replace it if
range-loading or sample quality disappoints.

**Use only its sample playback layer.** The app should still own a
`PlayAlongScheduler` plain-TS module. Reasons:

- Jazz Master needs one timeline that schedules exercise notes, metronome click,
  count-in, looping, stop, and tempo changes. That domain behavior should be
  tested without React or audio hardware.
- Chris Wilson's Web Audio scheduling guidance recommends a short JavaScript
  timer that schedules audio events ahead on the Web Audio clock, with 100 ms
  lookahead and 25 ms tick interval as a starting point [11].
- `smplr` can schedule individual sample starts at exact `AudioContext` times
  [9], so we do not need Tone.js's larger transport abstraction or smplr's
  higher-level sequencer to own the product timeline.

**Tone.js is credible but too broad for this slice.** Tone.js is MIT-licensed,
actively maintained, and provides a global Transport plus Sampler; its docs
explain sample-accurate event times, user-gesture audio start, loops, tempo ramps,
and sample callbacks [12][13]. It is a good DAW-style framework. For this app's
narrow monophonic line + click, that breadth is integration weight: a global
transport, tempo encodings, synth/effect surface, and its own timing model that
would still need wrapping behind a project seam. Reject for now.

**`soundfont-player` is superseded for us.** It has the useful ability to limit
decoded notes via a `notes` option, supports FluidR3_GM/MusyngKite and per-note
playback, and is MIT-licensed [14][15]. But `smplr`'s own docs present its
Soundfont instrument as a modern replacement for `soundfont-player` [3], with
newer TypeScript-friendly APIs, cache support, load progress, and shared loader
hooks. Use `soundfont-player` only if the first implementation discovers a
specific `smplr` Soundfont range-loading limitation that matters.

**Direct SoundFont2 loading is the wrong v1 asset shape.** `smplr` includes a
`Soundfont2` instrument that reads `.sf2` files directly [8], but the source
banks RES-015 considered are large whole-bank files: FluidR3_GM is 148 MB
uncompressed and MusyngKite is 1.75 GB uncompressed [1]. Even if browser parsing
works, downloading/parsing a full bank to play a two-octave guitar range fails
the asset-weight criterion. Prefer pre-rendered per-note MP3 subsets or a
project-owned manifest over runtime SF2 loading.

**Hand-rolled Web Audio sampler is not worth owning yet.** MDN confirms the
primitive is simple: create `AudioBufferSourceNode`s and call `start(when,
offset, duration)` against `AudioContext.currentTime` [16][17]. But a useful
sampler also needs fetch/decode caching, note-name/MIDI mapping, voice stop,
load progress, browser unlock handling, and TypeScript surface. `smplr` already
covers enough of that. Own the scheduler, not the sampler internals.

### 3. Scheduling: look-ahead Web Audio clock, not direct timers

The scheduling rule is clear and cross-checked:

- `BaseAudioContext.currentTime` is an ever-increasing hardware timestamp in
  seconds for scheduling audio playback [17].
- `AudioBufferSourceNode.start()` accepts a future `when` value in the same time
  coordinate system [16].
- JavaScript timers can be delayed by layout, GC, and main-thread work; they
  should not directly fire audio notes at the target instant [11].
- The stable pattern is a repeating JS scheduler that looks ahead and queues
  near-future Web Audio events, commonly starting around 100 ms lookahead and
  25 ms interval, tuned by device [11].

For Jazz Master, the scheduler should use a sixteenth/eighth grid derived from
the existing `deriveRhythm` helper: current exercises are straight eighths
(ADR-010), so event spacing is `60 / tempoBpm / 2`. A count-in can be four
quarter-note click events before the first note. Looping is not an audio-buffer
loop; it is repeated scheduling of note/click events on the same timeline, so
tempo changes can take effect after the current lookahead window rather than
waiting for a pre-rendered phrase to finish.

### 4. Asset loading/offline: lazy code, explicit CacheStorage, attribution

Non-playing views should load no playback code and no samples. The implementation
should dynamic-import the audio engine from the runner controls, mirroring the
VexFlow chunk discipline from TASK-039.

For samples, use `smplr`'s `CacheStorage` hook or an app-owned equivalent.
`smplr` documents that its default hosted samples are on GitHub Pages and can hit
rate limits; it recommends `CacheStorage` so first load fetches over HTTP and
later loads come from cache [10]. MDN confirms CacheStorage is available from
window/worker contexts, requires secure contexts, and can be used outside service
workers [18]. The live Workers dev URL is HTTPS, so this fits the deployed app;
local HTTP dev needs graceful fallback to normal fetch without claiming offline
sample availability.

Recommended asset path:

1. Start with FluidR3_GM `electric_guitar_jazz` from the Gleitzman set.
2. During TASK-046, prove whether `smplr.Soundfont` can avoid loading the whole
   instrument or whether `smplr.Sampler` with an app-owned note manifest is
   needed for range-only loading.
3. Mirror the chosen per-note MP3 subset under `apps/web/public/audio/play-along/`
   once the exact instrument/range is selected, with a repo attribution file for
   FluidR3_GM CC-BY-3.0.
4. Cache fetched sample responses via CacheStorage after the first play attempt.

This keeps external GitHub Pages availability out of the product path and makes
the offline story explicit.

### 5. EPIC-010 reuse: scheduler/count-in is shared; sampler is not

RES-014's recording/scoring recommendation assumes a metronome count-in before a
take and explicitly avoids scoring against an audible backing track in v1 [19].
The reusable infrastructure from EPIC-014 should therefore be:

- `PlayAlongScheduler` or lower-level `AudioClockScheduler`: lookahead loop,
  start/stop lifecycle, tempo update, count-in events, beat callbacks for UI.
- `MetronomeClick`: a small synthesized or short-sample click that can run
  without loading the guitar sample set.
- `ExerciseTimeline`: pure conversion from resolved positions + derived rhythm
  + tempo to note events and click events.

Do not couple EPIC-010 to `smplr` guitar playback. Recording needs the count-in
and timeline start time, not the instrument sampler.

## Recommendations

**Decision: adopt `smplr` for sampled playback, with a project-owned Web Audio
lookahead scheduler and FluidR3_GM electric/jazz guitar samples as the default
instrument.**

Implement in two slices:

1. **Playback engine (TASK-046):** add `smplr`, build a lazy-loaded audio module
   that schedules resolved exercise notes, a click, count-in, loop, stop, and
   tempo changes through a pure/tested timeline scheduler. Start with
   FluidR3_GM `electric_guitar_jazz`; measure actual loaded range and use
   `smplr.Sampler` + an app-owned manifest if `Soundfont` cannot range-load.
   Cache samples explicitly and include attribution.
2. **Runner controls + tempo persistence (TASK-047):** add play/stop/loop/click
   controls to the practice runner, expose a tempo slider capped at the authored
   `Exercise.tempoBpm`, and persist the player's last tempo per exercise through
   a typed store.

Considered and rejected:

- **Tone.js:** strong library, but too broad and global for one monophonic line
  plus click. Revisit only if later scope needs richer sequencing/effects.
- **`soundfont-player`:** useful note-limiting API, but older and effectively
  superseded by `smplr` for our use. Keep as fallback if `smplr` range behavior
  disappoints.
- **Direct SoundFont2 `.sf2` loading:** rejects the v1 asset-weight criterion;
  the credible free banks are whole-bank downloads, while this app needs a small
  per-note guitar subset.
- **Full hand-rolled sampler:** unnecessary ownership burden. Own scheduling and
  asset manifest decisions; reuse sampler playback/caching.
- **Piano-first v1:** technically safer but violates the owner's stated guitar
  timbre preference. Keep `SplendidGrandPiano` as a fallback seam if dogfood says
  guitar timbre is worse than clear piano.
- **Fixed audio/time-stretching:** rejected by task constraints and wrong for
  arbitrary BPM. Schedule notes at the requested tempo.

## Sources

[1] `gleitz/midi-js-soundfonts` README — https://github.com/gleitz/midi-js-soundfonts (FluidR3_GM CC-BY-3.0, MusyngKite/FatBoy CC-BY-SA-3.0, source bank sizes; accessed 2026-07-07)
[2] `midi-js-soundfonts` FluidR3_GM directory — https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM (per-instrument MP3 directories, including guitar instruments; accessed 2026-07-07)
[3] `smplr` README, Soundfont and SplendidGrandPiano docs — https://github.com/danigb/smplr (Soundfont wraps Gleitzman soundfonts; FluidR3_GM vs MusyngKite; piano notesToLoad; accessed 2026-07-07)
[4] VCSL README — https://github.com/sgossner/VCSL (CC0 sample library; accessed 2026-07-07)
[5] VCSL chordophones directories — https://github.com/sgossner/VCSL/tree/master/Chordophones (available chordophone folders; accessed 2026-07-07)
[6] npm registry metadata for `smplr` — https://registry.npmjs.org/smplr (latest 1.0.0, published/modified 2026-06-13, MIT, unpacked size 1,034,924 bytes; checked with `curl` 2026-07-07)
[7] GitHub API metadata for `danigb/smplr` — https://api.github.com/repos/danigb/smplr (pushed 2026-06-13, updated 2026-06-26, 0 open issues, 306 stars; checked with `curl` 2026-07-07)
[8] `smplr` instrument/load docs — https://github.com/danigb/smplr (available instruments, load progress, shared loader/scheduler options; accessed 2026-07-07)
[9] `smplr` scheduling docs — https://github.com/danigb/smplr (scheduled note starts use `time` in seconds against `audioContext.currentTime`; accessed 2026-07-07)
[10] `smplr` CacheStorage docs — https://github.com/danigb/smplr (sample caching and GitHub Pages rate-limit note; accessed 2026-07-07)
[11] Chris Wilson, "A tale of two clocks" — https://web.dev/articles/audio-scheduling (Web Audio scheduling, lookahead pattern; accessed 2026-07-07)
[12] Tone.js README — https://github.com/Tonejs/Tone.js (MIT, Transport, scheduling, user-gesture audio start; accessed 2026-07-07)
[13] Tone.js Sampler docs — https://tonejs.github.io/docs/15.0.4/classes/Sampler.html (Sampler trigger APIs; accessed 2026-07-07)
[14] `soundfont-player` README — https://github.com/danigb/soundfont-player (FluidR3_GM/MusyngKite support, note limiting, player API; accessed 2026-07-07)
[15] `soundfont-player` package/license metadata — https://github.com/danigb/soundfont-player (MIT; accessed 2026-07-07)
[16] MDN `AudioBufferSourceNode.start()` — https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start (future `when` scheduling; accessed 2026-07-07)
[17] MDN `BaseAudioContext.currentTime` — https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime (hardware timestamp for scheduling; accessed 2026-07-07)
[18] MDN CacheStorage — https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage (secure-context cache API available from window/worker scopes; accessed 2026-07-07)
[19] RES-014 — `research/RES-014-audio-recording-scoring.md` (EPIC-010 count-in and recording/scoring constraints; accessed locally 2026-07-07)
[20] Sample-size header measurement — command run 2026-07-07: `curl -L -sI <raw MP3 URL> | awk ...` against `https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/{MusyngKite,FluidR3_GM}/{acoustic_guitar_nylon-mp3,electric_guitar_jazz-mp3}/E{3,5}.mp3`; measured `Content-Length` values recorded in Findings Q1.
