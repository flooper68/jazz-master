# CNC production adaptive loop

This example combines planning, execution, compilation, and adaptation in one
small process. A larger implementation may split or parallelize them.

1. Read the approved request, CAD/drawing revision, current plan, prior work log,
   compiled knowledge, capacity, and constraints.
2. Update `work/PLAN.md`: batch/revision, artifact contract, material, machine,
   tooling, operations, validation, responsibilities, and open questions.
3. Resolve load-bearing uncertainty through discussion, research, calculation,
   simulation, coupon testing, or a prototype before committing the batch.
4. Execute the approved setup and toolpath. Record deviations, failed attempts,
   machine evidence, and successful resolutions in `work/LOG.md`.
5. Inspect artifact correctness against the released drawing. Reject or route
   nonconformity rather than smoothing it over.
6. Send an accepted sample to assembly fit/load validation. Record outcome
   evidence when it arrives; artifact completion does not manufacture an outcome.
7. At the locally chosen trigger, review new raw evidence and update
   `knowledge/README.md`; append a short entry to `knowledge/CHANGELOG.md`.
8. Propose changes to planning, tooling, execution, validation, or system
   structure. The manufacturing lead approves before the next plan uses them.
9. Close the batch or schedule the next invocation.
