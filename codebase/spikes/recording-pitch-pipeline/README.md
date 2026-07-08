# Recording pitch pipeline spike

Quarantined TASK-040 harness for checking the RES-014 recording/scoring pipeline
on real guitar audio. This is not imported by the Astro app and should not be
promoted to product code as-is.

## Run

From this directory:

```sh
python3 -m http.server 4177
```

Open `http://localhost:4177/`. `localhost` is a secure context for microphone
capture in modern browsers.

## Exercise

Play C major one octave as quarter notes at 80 BPM:

```text
C D E F G A B C
```

Use the visual four-beat count-in. The analyzer aligns timing to the first
detected pitched onset, so a constant reaction-time offset does not dominate
the onset stats.

## Measurement protocol

1. Record at least 3 takes of the exercise.
2. After each take, inspect the detected note table for missed notes, octave
   errors, and onset deviations.
3. Copy the markdown table into `work/tasks/TASK-040-spike-recording-pitch-pipeline.md`.
4. Add a written conclusion: whether the pipeline is good enough to feed
   TASK-042, plus the parameter picks and failure modes observed.

Use laptop mic first. If available, repeat through an audio interface and note
the capture path in the conclusion.

## Current parameters

- Capture: `getUserMedia` requested with echo cancellation, noise suppression,
  and auto gain disabled.
- Recording: `MediaRecorder` prefers `audio/webm;codecs=opus`, then `audio/webm`,
  then `audio/mp4`.
- Decode: browser `AudioContext.decodeAudioData`, mixed to mono.
- Onsets: short-frame RMS flux with an energy fallback.
- Pitch: YIN-style difference/CMND estimator, 4096-sample frame, 70-1000 Hz.
- Matching: by expected note order, pitch-class match octave-agnostic, onset
  measured against an 80 BPM grid anchored to the first detected pitched onset.

## Verification

From the repo root:

```sh
bun codebase/spikes/recording-pitch-pipeline/synthetic-check.mjs
git grep -n "recording-pitch-pipeline" -- codebase/apps/web/src/app
bun run --cwd codebase check
```

The synthetic check should report 8/8 pitch-class accuracy on generated audio.
The grep command should return no product imports.
