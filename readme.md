# Git Merge Task

## Overview
This task allows you to test merges of branches, failing the build if branches cannot be automatically merged. You can also commit
a merges from a branch into another branch.  Please [follow these instructions](./install.md) to install the task to your VSTS subscription.

## Modes
The task operates in 1 of 2 modes:
- **Test Merge** which tests if branches can be merged, but never commits
- **Merge** which commits and pushes a merge

### Test Merge Mode
When running in Test Merge Mode, you must set the repository of the build (in the Repository tab) to the "target" repo. Then specify:
- **Branch(es) to Test Merge** - this is a comma-separated list of branches you want to test merging into the "target" repo
- **Test merging all branches** - check this to test merging all the branches sequentially. If cleared, each branch will be tested independently.

### Merge Mode
When running in Merge Mode, you must set the repository of the build (in the Repository tab) to the branch you want to merge. Then specify:
- **Branch to merge into** - this is the branch to merge into (default is `master`)

When queuing the build, you can specify a commit Id if you want to merge an older commit Id. Otherwise the head of the branch repo will be merged.

## Advanced Settings
1. **Name of this remote**: Name of the remote in VSTS (or TFS). Defaults to `origin`.
2. **PAT**: Your personal access token must be set here if you are using this task in a "Release" workflow.
