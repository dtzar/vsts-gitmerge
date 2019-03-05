# Git Merge Task

## Overview
This [VSTS marketplace task](https://marketplace.visualstudio.com/items?itemName=dtzar.git-merge) does a test merge or actual merge and push of vsts-based git branches in the build or release areas.

## Modes
The task operates in 1 of 2 modes:
- **Test Merge** - tests if branches can be merged, but never commits <br>
The specified branches will attempt to merge only local to the build agent and if the branches cannot be automatically merged (i.e. merge conflicts) then the task will fail.  Otherwise the task passes without committing any merges.
- **Merge** - which commits and pushes a merge between two branches.

### Test Merge Mode
When running in Test Merge Mode, you must set the repository of the build (in the Repository tab) to the "target" repo. Then specify:
- **Branch(es) to Test Merge** - this is a comma-separated list of branches you want to test merging into the "target" repo

### Merge Mode
When running in Merge Mode, you must set the repository of the build (in the Repository tab) to the branch you want to merge. Then specify:
- **Branch to merge into** - this is the branch to merge into (default is `master`)

When queuing the build, you can specify a commit Id if you want to merge an older commit Id. Otherwise the head of the branch repo will be merged.

## Advanced Settings
1. **Name of this remote**: Name of the remote in VSTS (or TFS). Defaults to `origin`.
2. **PAT**: Your personal access token must be set here if you are using this task in a "Release" workflow.
