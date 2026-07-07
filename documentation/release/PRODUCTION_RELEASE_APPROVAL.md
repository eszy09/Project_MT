# Production Release Approval

Production release approval is intentionally separate from code review.

The project owner must approve production release by running the `Production Release Review` workflow and entering this exact statement:

```text
I approve this Project_MT production release
```

The workflow also requires:

- release candidate identifier
- backup restoration evidence reference
- incident drill evidence reference

No assistant, automation, or contributor may approve production release on behalf of the project owner.
