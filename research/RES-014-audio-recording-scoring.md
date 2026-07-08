---
id: RES-014
title: Browser audio recording & pitch-detection feasibility for guitar take scoring
status: complete
task: TASK-015
created: 2026-07-07
stale_when: >
  A browser-ready polyphonic guitar transcription model materially better than
  Basic Pitch ships; Safari/iOS changes mic-capture or AudioWorklet behavior in
  a way that removes the current caveats (e.g. reliable raw-input constraints on
  iOS); the app gains a backend that could do server-side analysis; or
  dogfooding/QA of the shipped recording pipeline contradicts the accuracy
  expectations recorded here.
---

# RES-014 — Browser audio recording & pitch-detection feasibility

VIS-001 names recording + machine scoring the product's riskiest bet. This research
answers TASK-015's six questions so EPIC-010 can proceed on evidence.

**Verdict up front: staged-go.** Monophonic (single-note-line) scoring with
offline-after-the-take analysis is credible in the browser today on well-trodden
technology. Real-time note-by-note feedback and chord/polyphonic scoring are not
credible for v1 — the first is a latency/complexity trap on iOS, the second is
capped by model quality and bundle size. Details and staging below.

**Outcome addendum 2026-07-08.** The recommendation to de-risk first with a
throwaway real-guitar spike was superseded by owner decision (NOTE-010):
TASK-040 was abandoned, and TASK-041/TASK-042 proceed from this research plus
synthesized-fixture evidence. The technical risk is accepted rather than
resolved.

## Research questions

1. Which algorithms/libraries work for monophonic guitar pitch detection in the browser, and how accurately?
2. Is onset detection good enough for timing scores at practice tempos?
3. Is polyphonic (chord) scoring realistically out of reach client-side, or partially scorable?
4. What latency/UX constraints apply: mic permissions, iOS Safari quirks, AudioWorklet vs offline-after-take processing?
5. What does a fair, motivating 0–100 score look like given detected vs expected notes/onsets? What does prior art do?
6. What does keeping takes locally cost vs storing score-only?

## Findings

### 1. Monophonic pitch detection: solved problem, mature browser options

**Algorithms.** The classical lineage is autocorrelation → YIN → MPM/McLeod →
pYIN → CREPE (ML):

- Naive autocorrelation works in a ~200-line browser tuner but suffers octave
  errors — the classic failure mode is picking a period one octave off, and
  practitioner write-ups of Web Audio tuners hit exactly this on guitar
  strings [11][12].
- **YIN** (de Cheveigné & Kawahara, JASA 2002) fixes most of this with a
  cumulative-mean-normalized difference function; the paper reports error rates
  **about three times lower than the best competing methods**, no upper limit on
  the search range, and low-latency-friendly implementation [1].
- **MPM/McLeod** ("A Smarter Way to Find Pitch", McLeod & Wyvill 2005) uses a
  normalized squared difference function bounded to [−1, 1], giving a reliable
  clarity/confidence threshold — designed specifically for real-time musical
  instrument tracking [2][3].
- **pYIN** (Mauch & Dixon, ICASSP 2014) adds probabilistic thresholds + Viterbi
  smoothing over YIN and beats plain YIN on precision; it is the standard
  offline monophonic tracker in MIR tooling [4].
- **CREPE** (Kim et al., ICASSP 2018) is a CNN on raw waveforms that performs
  "equally or better than pYIN" [5] — but the **browser** version is a
  stripped model with **less than 3% of the parameters**, admits it "may make
  more octave errors than the full model," and wants hardware sample rates that
  are multiples of 16 kHz [6]. ml5.js's CREPE-based pitchDetection has
  additionally suffered model-hosting breakage (model URL dead as of July 2024
  per ml5 issue tracker) [7].

**Libraries (checked on the npm registry 2026-07-07):**

| Library | Algorithm | Latest release | Notes |
|---|---|---|---|
| `pitchy` | MPM | 4.1.0 (2024-01-04) | Pure ESM JS, clarity score, 0BSD license; targets real-time tuner use [2] |
| `pitchfinder` | YIN, AMDF, DynamicWavelet, etc. | 2.3.4 (2025-12-16) | Grab-bag of JS detectors, actively published [9] |
| `aubiojs` | YIN/YINFFT + onset + tempo | 0.2.1 (2022-11-08) | Emscripten WASM build of aubio; stale but aubio itself is stable [10] |
| `essentia.js` | pYIN, Melodia, chroma/HPCP, onsets | 0.1.3 (2021-06-24) | MTG/UPF's WASM build of Essentia; TISMIR-published, broad MIR coverage, but effectively unmaintained since 2021 [8] |
| `@spotify/basic-pitch` | polyphonic CNN (TF.js) | 1.0.1 (2022-08-05) | See Q3 [16] |

**Guitar-specific accuracy expectations.** Monophonic guitar is close to the
best case for these algorithms: strong periodicity, sustained notes, and a
range (E2 ≈ 82 Hz up the fretboard) with no "upper limit" issue for YIN [1].
The hazards are (a) octave errors on the low strings, where fundamentals are
weak relative to harmonics — the documented failure mode of naive
autocorrelation, largely mitigated by YIN/MPM [1][11][12]; (b) the pick attack
transient, during which the first ~1–2 analysis frames are unreliable (score
the sustained portion, not the attack); and (c) window size: detecting 82 Hz
needs at least two periods ≈ 24 ms — rounded up to 2048 samples (~43 ms) at 48 kHz — which sets the
floor on frame size and thus on time resolution. Tuner-grade precision (a few
cents) under quiet close-mic conditions is the norm for YIN-family detectors
[12 — vendor claim, treat as order-of-magnitude], and our use is coarser: we
only need to classify to the nearest semitone (±50 cents), a far easier target
than a tuner's ±2 cents.

**Pick:** MPM via `pitchy` (or YIN via `pitchfinder`) on 2048-sample windows of
the recorded take. Both are dependency-free JS — no WASM, no model download.
CREPE-in-browser is rejected for v1: its accuracy advantage evaporates in the
stripped browser model [6], it drags in TensorFlow.js, and the ml5 wrapper has
demonstrated bit-rot [7].

### 2. Onset detection: good enough at practice tempos, with a guitar caveat

- The MIR literature evaluates onset detectors with **±50 ms tolerance
  windows** as the standard correctness criterion [13][14]. Spectral-flux-based
  methods score high on percussive/plucked material; CNN detectors reach
  F ≈ 0.90 overall, with spectral flux variants (SuperFlux/ComplexFlux) close
  behind and best-in-class on many categories [13].
- Picked guitar is a **favorable** case: the pick attack is a sharp broadband
  transient. The hard cases documented for guitar are soft onsets — legato,
  hammer-ons, slides — which motivated a dedicated EURASIP journal paper and
  precise-onset guitar dataset [14]. Jazz single-note drills at our practice
  tempos are mostly picked; v1 should simply avoid scoring legato-heavy
  exercises.
- Timing math: at 60–160 BPM, consecutive eighth notes are 500 ms down to
  187 ms apart. A ±50 ms detection tolerance is comfortably smaller than half
  the smallest inter-onset gap, so onsets can be unambiguously assigned to
  expected notes. Rhythm-game hit windows calibrate what "fair" feels like:
  ±100 ms is the conventional "normal difficulty" full-credit window
  [15], osu!'s hardest window is ±18 ms [15b] — i.e. human-fair windows are
  ≥ ±100 ms for learners, well inside what browser-side detection achieves.
- Implementations: `aubiojs` exposes aubio's onset module in WASM [10];
  essentia.js has onset detection [8]; and a spectral-flux detector over an
  FFT of the recorded buffer is a few dozen lines if we prefer zero deps.
  For offline analysis, a simple energy/flux detector cross-checked against
  pitch-track discontinuities (new note = new pitch segment) is the pragmatic
  route.

**Pick:** offline onset detection on the recorded take (spectral flux or
aubio), fused with pitch-segment boundaries; score timing with tiered windows
(see Q5).

### 3. Polyphony/chords: partially scorable at best — stage it out of v1

- The only credible client-side polyphonic option is **Spotify Basic Pitch**:
  a deliberately lightweight instrument-agnostic CNN with an official
  TypeScript/TF.js package that runs in the browser (audio resampled to
  22.05 kHz) [16][17]. The paper (ICASSP 2022) claims frame-level accuracy
  "only marginally below specialized state-of-the-art AMT systems" [17].
  Caveats: GuitarSet was largely *in its training set* [17b — single source],
  the npm package has not been released since **2022-08-05** [16], and we did
  not find published note-level F-measures specifically for strummed chord
  audio (single-source gap — our spike should measure this if we ever attempt
  chords). State-of-the-art polyphonic transcription is a genuinely hard,
  active research problem; nobody claims tuner-grade reliability for it.
- The cheap alternative for **chord checking** (not transcription) is chroma /
  pitch-class-profile template matching, the approach that founded automatic
  chord recognition (Fujishima 1999) and a well-studied baseline since
  [18]. It answers "does the played sonority match a Cmaj7 template?" rather
  than "which six notes were played" — template methods achieve modest but
  real accuracy on controlled input and degrade with inversions/voicing
  ambiguity [18]. essentia.js ships HPCP/chroma extractors [8]. This could
  power a later "roughly right chord? yes/no" feature — a boolean with a
  forgiving threshold, never per-string feedback.
- Prior-art expectation-setting: even commercial products with dedicated
  hardware struggle here — Rocksmith's mic mode is documented by Ubisoft as
  needing careful gain and 30–60 cm mic placement and is community-known as
  less reliable than the direct cable [32]; Yousician reviews consistently
  flag chord/polyphony detection as its weak spot [31 — anecdotal].

**Pick:** v1 scores **monophonic lines only** (this matches EPIC-010's stated
out-of-scope). Chord scoring, if ever, arrives later as a chroma-template
"close enough" check, explicitly not per-note. Full polyphonic transcription
client-side: rejected — model quality, bundle weight (TF.js + model), and a
2022-frozen package make it a bad bet for a solo-dev product.

### 4. Latency & UX: record-then-analyze avoids almost every trap

- **Permissions:** `getUserMedia` requires a secure context; ask on an explicit
  user gesture (the record button), never on page load. Standard constraint
  advice for **music** capture is to disable speech processing:
  `echoCancellation: false, noiseSuppression: false, autoGainControl: false` —
  the processing chain otherwise mangles instrument signals and recording
  alongside a backing track [19][20]. Caveat, cross-checked: browsers don't
  always honor this — a 2024 Chromium bug reports platforms where
  echoCancellation/noiseSuppression can't actually be disabled [21], and an
  old WebKit bug reports the constraint having no effect [21b]. So: request
  raw audio, but design the scorer to tolerate processed audio (pitch class
  survives AGC; absolute levels don't — don't score dynamics).
- **iOS Safari:** AudioContext starts suspended and must be resumed inside a
  user gesture [22]; there are long-standing sample-rate quirks (context locked
  to 44.1 kHz while the device runs 48 kHz, causing drift in edge cases) [22b]
  — always read `audioContext.sampleRate` at runtime rather than assuming.
  getUserMedia on iOS also reroutes output to the speaker in some
  configurations [22c]. All are workaroundable, but they argue for the
  simplest possible audio graph on iOS.
- **Architecture:** real-time in-worklet analysis (AudioWorklet's 128-frame
  quantum, ring buffers, and the SharedArrayBuffer pattern that requires
  COOP/COEP headers) is the documented high-effort path for live feedback
  [25]. The alternative — **record the whole take, then analyze the buffer
  offline** (main thread in chunks or a Web Worker) — needs none of that:
  no real-time deadline, no SAB headers, no worklet debugging, identical
  scoring quality, and analysis of a 60 s mono take with YIN/MPM is a
  sub-second batch job on modern hardware. For a "record a take, get a score"
  product loop (not a live game), offline is strictly simpler.
- **Sync with a backing track:** browser round-trip audio latency is ~30 ms
  best case and commonly 20–40+ ms, varying by device/OS [26]; scoring a take
  against audio the user *hears* requires latency calibration (loopback beep
  measurement) [26]. **Recording against a visual/metronome count-in with a
  known timeline start avoids depending on unknown output latency for v1** —
  and per-note timing can additionally be scored relative to the take's own
  first detected onset, making a constant offset harmless.
- **Capture format:** `MediaRecorder` with `audio/webm;codecs=opus` now works
  across Chrome, Firefox and Safari — Safari added WebM/Opus in **18.4
  (2025-03-31)** [23]; older Safari falls back to `audio/mp4` (AAC), which it
  has supported since MediaRecorder arrived in Safari 14 [24]. Decode to PCM
  with `decodeAudioData` for analysis. (Capturing raw PCM ourselves via a
  trivial recorder worklet is a clean fallback and gives lossless analysis
  input, at WAV-sized memory cost — fine for takes of a few minutes.)

**Pick:** offline-after-take processing; getUserMedia with processing
disabled but tolerance for it being ignored; metronome count-in rather than
scored-against-backing-track in v1; MediaRecorder Opus with AAC fallback (or
raw-PCM worklet capture).

### 5. Scoring design: per-note verdicts, generous tiers, 0–100 from components

Prior art:

- **SmartMusic/MakeMusic** (decades of institutional assessment): per-note
  binary verdicts — green notehead = right pitch at the right time, red =
  wrong/missed; it scores pitch + rhythm only, no partial credit per note, and
  offers **lenient/average/strict tolerance settings** [30]. Its documented
  failure mode is instructive: users report correct notes marked wrong (mic
  placement etc.), and studies noted students relieved to escape unfair red
  marks [30b — anecdotal but consistent across sources]. Lesson: **false
  negatives are the motivation killer**; when uncertain, credit the player.
- **Yousician**: mic-based pitch+timing tracking with instant per-note
  correct/incorrect UI; reviews praise timing strictness and flag polyphony
  weakness [31 — anecdotal; engineering internals are not public, no primary
  source found]. **Rocksmith+**: mic mode needs 30–60 cm placement, moderate
  gain [32]. **Melodics**: color-codes each hit as on-time / a little early /
  a little late rather than pass/fail [33 — exact ms windows not documented
  anywhere we found].
- **Rhythm-game calibration:** ±100 ms ≈ conventional "normal" full-credit
  window; only expert modes tighten toward ±20 ms [15][15b].
- **Academic assessment systems** align the performance to the score first —
  DTW alignment of detected vs expected sequences is the standard — then
  compute pitch/rhythm/completeness components; score-aligned features
  correlate best with human judges [34]. For a *known short exercise* played
  against a count-in, full DTW is overkill; greedy nearest-onset matching
  within a window is the standard simple case, with DTW as an upgrade path if
  users drift (rubato, dropped beats).

**Recommended v1 scoring model** (each element traceable to the findings
above):

- Match detected note events to expected notes greedily by onset proximity
  (window: ±250 ms cap), requiring pitch match to the nearest semitone
  (detected f0 within ±50 cents of target) [1][13][15][34].
- Per-note verdict: **correct** (pitch right, onset within ±100 ms), **late/
  early** (pitch right, within ±250 ms — partial credit, labeled like
  Melodics' early/late colors [33]), **wrong pitch**, **missed**. Extra
  (inserted) notes count against a completeness component, gently.
- Score = weighted blend, e.g. 60% pitch correctness, 30% timing quality of
  matched notes, 10% completeness/no-extras — components shown separately so
  the number is explainable per note (SmartMusic's green/red per-note display
  is the proven feedback unit [30]).
- Fairness bias: octave-agnostic pitch matching (octave errors are the
  detector's dominant failure [1][6][11]) and "when in doubt, credit" — the
  SmartMusic lesson [30b]. Tolerances should be a user-visible
  lenient/standard/strict setting from day one [30].
- 0–100 with these tiers is motivating-by-construction: a competent take
  scores high, sloppiness shows up in the timing component, and nothing
  scores zero because the mic glitched.

### 6. Privacy & storage: takes are cheap to keep locally, and worth keeping

- **Size math:** mono 48 kHz 16-bit WAV ≈ 5.76 MB/min (96 KB/s); Opus at
  48 kbps ≈ 0.36 MB/min — a 2-minute take is ~11.5 MB raw or **under 1 MB as
  Opus**, and 48–64 kbps Opus is the documented "acceptable-to-good music"
  range [29]. A year of daily 2-minute takes in Opus is ~260 MB.
- **Quota (MDN, updated 2026-01-05):** Chrome allows up to 60% of disk per
  origin; Firefox best-effort min(10% of disk, 10 GiB); Safari (macOS 14 /
  iOS 17+) ~60% of disk for browser-loaded origins [27]. Hundreds of MB is
  a non-issue.
- **Eviction is the real risk, not quota:** Safari proactively deletes ALL
  script-writable storage (IndexedDB, OPFS, Cache) for origins with **no user
  interaction in 7 days** under ITP [27][28], and best-effort storage anywhere
  can be evicted under pressure — eviction removes the origin's data wholesale
  [27]. `navigator.storage.persist()` exempts an origin from pressure eviction
  [27]. Consequence for us: audio takes stored in IndexedDB must be treated as
  a cache, not an archive — same posture ADR-002 already takes for practice
  data generally.
- **Privacy:** local-only analysis means audio never leaves the device — no
  upload consent surface, no server-side voice-data handling; this is the
  cheapest possible privacy story and consistent with EPIC-010's local-only
  scope. The only UX obligation is honest mic-permission framing.
- **Are takes worth keeping at all?** Music-pedagogy sources are unanimous
  that recording yourself and listening back is one of the highest-leverage
  practice tools (hearing what you actually played vs what you think you
  played) [35]. So: keep the take **in memory for immediate replay** after
  scoring (near-zero cost, real pedagogical value), persist **score +
  per-note metadata only** by default, and treat "save this take" as an
  explicit opt-in later — storage cost is trivial (see math), so the gate is
  product simplicity, not bytes.

## Recommendations

**Verdict: staged-go.**

**Stage 1 (v1, adopt now): monophonic lines only, offline analysis after the take.**
- Capture: getUserMedia on the record button, `echoCancellation/noiseSuppression/autoGainControl: false` (tolerating non-compliance), level meter, metronome count-in; MediaRecorder `audio/webm;codecs=opus` with `audio/mp4` fallback, decoded via `decodeAudioData` (raw-PCM worklet capture as fallback if decode paths prove flaky).
- Analysis: MPM (`pitchy`) or YIN (`pitchfinder`) over 2048-sample hops + spectral-flux/pitch-segment onset detection, run offline on the recorded buffer.
- Scoring: greedy onset matching, semitone pitch tolerance, ±100 ms full-credit / ±250 ms partial timing windows, 60/30/10 pitch/timing/completeness blend, per-note verdicts, lenient/standard/strict setting, octave-agnostic matching.
- Persistence: score + per-note results onto the session record; take replayable in-session, not persisted.
- **De-risk first with a throwaway spike** on real guitar signals (acoustic via mic + electric via interface) before building any UI — the one thing this research cannot verify from sources is our own end-to-end pipeline quality on real input.

**Stage 2 (after v1 proves out):** persisted takes behind explicit save (with `navigator.storage.persist()`), latency-calibrated scoring against audible backing tracks, tolerance tuning from dogfood data.

**Stage 3 (explicitly gated, may never happen):** chroma-template chord "close enough" checking. Re-evaluate the polyphonic-model landscape before attempting anything per-note.

**Considered and rejected:**
- *Real-time note-by-note feedback (AudioWorklet pipeline) for v1* — the full SAB/COOP/COEP/worklet apparatus [25] plus iOS quirks [22] for zero scoring-quality gain over offline analysis; revisit only if a "live trainer" feature is ever prioritized.
- *CREPE/ML monophonic detection in-browser* — stripped browser model loses the accuracy advantage [6], TF.js weight, ml5 bit-rot [7]; DSP detectors suffice at semitone granularity.
- *Basic Pitch polyphonic transcription in v1* — 2022-frozen npm package [16], unverified chord-level accuracy on strums (single-source gap), heavy runtime; contradicts "small, credible first slice".
- *Scoring against an audible backing track in v1* — requires round-trip latency calibration (~20–40 ms unknown offset) [26]; count-in metronome sidesteps it entirely.
- *essentia.js as the core dependency* — broadest algorithm coverage but unmaintained since 2021 [8]; prefer tiny maintained JS libs.
- *No-go / do nothing* — rejected: the evidence says the monophonic slice is well within reach, and it is the product's declared riskiest bet precisely because it closes the feedback loop (VIS-001).

## Sources

[1] de Cheveigné & Kawahara, "YIN, a fundamental frequency estimator for speech and music", JASA 111(4), 2002 — https://pubs.aip.org/asa/jasa/article/111/4/1917/547221 / PDF: http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf (published 2002, accessed 2026-07-07)
[2] pitchy — https://github.com/ianprime0509/pitchy (v4.1.0 released 2024-01-04; npm registry checked 2026-07-07)
[3] McLeod & Wyvill, "A Smarter Way to Find Pitch", ICMC 2005 (cited via pitchy README [2], accessed 2026-07-07)
[4] Mauch & Dixon, "pYIN: A fundamental frequency estimator using probabilistic threshold distributions", ICASSP 2014 — https://ieeexplore.ieee.org/document/6853678/ (published 2014, accessed 2026-07-07)
[5] Kim, Salamon, Li, Bello, "CREPE: A Convolutional Representation for Pitch Estimation", ICASSP 2018 — https://arxiv.org/abs/1802.06182 (published 2018, accessed 2026-07-07)
[6] CREPE browser demo (stripped model <3% of parameters, 16 kHz caveats) — https://marl.github.io/crepe/ (undated, accessed 2026-07-07)
[7] ml5.js pitchDetection model breakage — https://github.com/ml5js/ml5-library/issues/1489 (July 2024, accessed 2026-07-07)
[8] essentia.js — https://mtg.github.io/essentia.js/ and TISMIR paper https://transactions.ismir.net/articles/10.5334/tismir.111 (paper 2021; npm 0.1.3 published 2021-06-24, registry checked 2026-07-07)
[9] pitchfinder — https://github.com/peterkhayes/pitchfinder (npm 2.3.4 published 2025-12-16, registry checked 2026-07-07)
[10] aubiojs — https://github.com/qiuxiang/aubiojs (npm 0.2.1 published 2022-11-08, registry checked 2026-07-07)
[11] "Detecting pitch with the Web Audio API and autocorrelation" — https://alexanderell.is/posts/tuner/ (undated blog, accessed 2026-07-07)
[12] pitch-detector.com FAQ (YIN accuracy claims; vendor marketing — order-of-magnitude only) — https://pitch-detector.com/faq (undated, accessed 2026-07-07)
[13] Onset-detection evaluation practice (±50 ms tolerance; SuperFlux/CNN F≈0.9) — https://musicinformationretrieval.wordpress.com/2017/02/03/state-of-the-art-for-audio-onset-detection-week-3/ (2017) and Böck et al. via same survey (accessed 2026-07-07)
[14] "Musical note onset detection based on a spectral sparsity measure", EURASIP JASMP, 2021 (guitar-specific onset difficulty, precise-onset guitar dataset) — https://asmp-eurasipjournals.springeropen.com/articles/10.1186/s13636-021-00214-7 (published 2021, accessed 2026-07-07)
[15] Guitar Hero ±100 ms conventional window — https://ece4760.github.io/Projects/Spring2025/jrv67_der242/keyboard--hero.html (2025) and ±100 ms as standard rhythm-chart tolerance, STRUM paper https://arxiv.org/pdf/2605.12135 (2026); [15b] osu! hardest window ±18 ms — https://www.guitar-hero.ch/osu/ (undated; all accessed 2026-07-07)
[16] @spotify/basic-pitch (repo: basic-pitch-ts) — https://github.com/spotify/basic-pitch-ts (v1.0.1 published 2022-08-05, registry checked 2026-07-07; resamples input to 22.05 kHz, Apache-2.0)
[17] Bittner et al., "A Lightweight Instrument-Agnostic Model for Polyphonic Note Transcription and Multipitch Estimation", ICASSP 2022 — https://arxiv.org/abs/2203.09893 (2022, accessed 2026-07-07); [17b] GuitarSet-in-training-data noted via https://huggingface.co/spotify/basic-pitch (single source, accessed 2026-07-07)
[18] Template-based chord recognition lineage from Fujishima 1999 PCP — Oudre et al., "Probabilistic template-based chord recognition" http://www.laurentoudre.fr/publis/OFG-IEEE-11.pdf and ISMIR 2009 "Template-based chord recognition" https://archives.ismir.net/ismir2009/paper/000046.pdf (accessed 2026-07-07)
[19] getUserMedia audio constraints for music (disable EC/NS/AGC) — https://blog.addpipe.com/getusermedia-audio-constraints/ (accessed 2026-07-07)
[20] MDN MediaTrackSettings / constraints — https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings (accessed 2026-07-07)
[21] Chromium: "Microphone echoCancellation and noiseSuppression cannot be disabled via media constraints" — https://issues.chromium.org/issues/327472528 (2024); [21b] WebKit bug 179411 echoCancellation constraint no effect — https://bugs.webkit.org/show_bug.cgi?id=179411 (2017; both accessed 2026-07-07)
[22] Unlocking Web Audio in Safari/iOS (resume on gesture) — https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos (accessed 2026-07-07); [22b] Safari sample-rate bug — https://github.com/chrisguttandin/standardized-audio-context/issues/489; [22c] iOS speaker rerouting under getUserMedia — https://medium.com/@python-javascript-php-html-css/ios-safari-forces-audio-output-to-speakers-when-using-getusermedia-2615196be6fe (accessed 2026-07-07)
[23] WebKit Features in Safari 18.4 (MediaRecorder WebM/Opus; released 2025-03-31) — https://webkit.org/blog/16574/webkit-features-in-safari-18-4/ (2025, accessed 2026-07-07); cross-checked by https://media-codings.com/articles/recording-cross-browser-compatible-media
[24] WebKit "MediaRecorder API" (Safari 14, mp4/AAC) — https://webkit.org/blog/11353/mediarecorder-api/ (2020, accessed 2026-07-07)
[25] Audio Worklet design patterns (ring buffer, SharedArrayBuffer + Worker, WASM) — https://developer.chrome.com/blog/audio-worklet-design-pattern/ and https://googlechromelabs.github.io/web-audio-samples/audio-worklet/design-pattern/shared-buffer/ (accessed 2026-07-07)
[26] Browser round-trip audio latency ~30 ms best case; loopback calibration — Ulf Hammarqvist, W3C/SMPTE Media Production workshop https://www.w3.org/2021/03/media-production-workshop/talks/ulf-hammarqvist-audio-latency.html (2021) and https://superpowered.com/webbrowserlatency (accessed 2026-07-07)
[27] MDN "Storage quotas and eviction criteria" — https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (page updated 2026-01-05, accessed 2026-07-07)
[28] WebKit 7-day cap on script-writable storage (ITP) — https://webkit.org/blog/14403/updates-to-storage-policy/ and coverage in [27] (accessed 2026-07-07)
[29] Opus quality/bitrate for music — https://wiki.xiph.org/Opus_Recommended_Settings and https://cloudinary.com/guides/video-formats/opus-codec (accessed 2026-07-07); WAV math is arithmetic (48000 Hz × 2 B mono = 5.76 MB/min)
[30] MakeMusic/SmartMusic visual assessment (green/red noteheads; pitch+rhythm only; tolerance levels) — https://help.makemusic.com/hc/en-us/articles/360026372933-Understanding-visual-assessment and https://smartmusic.zendesk.com/hc/en-us/community/posts/360033645714-12-18-18-Assessment-tolerance (accessed 2026-07-07); [30b] accuracy complaints — SmartMusic community posts + Long, UNCG dissertation https://libres.uncg.edu/ir/uncg/f/Long_uncg_0154D_10639.pdf (anecdotal/qualitative, accessed 2026-07-07)
[31] Yousician behavior and limits (mic pitch/timing tracking, strict timing, weak polyphony) — https://www.guitarchalk.com/yousician-review/ and https://musicianstack.com/tools/yousician/ (anecdotal reviews; no primary engineering source found — flagged, accessed 2026-07-07)
[32] Ubisoft Rocksmith+ help (mic placement 30–60 cm, gain affects detection) — https://www.ubisoft.com/en-us/help/rocksmith-plus/connectivity-and-performance (accessed 2026-07-07)
[33] Melodics timing feedback (on-time/early/late color coding; ms windows not published) — https://support.melodics.com/en/articles/6777096-melodics-app-settings (accessed 2026-07-07)
[34] Huang & Lerch, "Automatic Assessment of Sight-Reading Exercises", ISMIR 2019 — https://archives.ismir.net/ismir2019/paper/000070.pdf ; "Score-informed Networks for Music Performance Assessment" https://arxiv.org/pdf/2008.00203 (DTW/score-aligned features standard; accessed 2026-07-07)
[35] Self-recording pedagogy — https://www.musiciansway.com/blog/2014/02/5-benefits-of-self-recording/ and https://www.modacity.co/blog/why-important-to-record-yourself-during-practice (accessed 2026-07-07)
