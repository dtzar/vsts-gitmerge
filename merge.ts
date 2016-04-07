import * as tl from 'vso-task-lib/vsotask';
import * as tr from 'vso-task-lib/toolrunner';
import * as ut from './functions';

tl.debug("Starting 'Git Merge' task");

// get the task vars
var mergeType = tl.getInput("mergeType", true);
var branchesToMergeStr = tl.getInput("branchesToTest", false);
var branchToMergeInto = tl.getInput("branchToMergeInto", false);
var testMergeAll = tl.getBoolInput("testMergeAll", true);
var remoteName = tl.getInput("remoteName", true);
var buildSourceBranch = tl.getVariable("Build.SourceBranch");
var commitId = tl.getVariable("Build.SourceVersion");

tl.debug(`mergeType: ${mergeType}`);
tl.debug(`branchesToMerge: ${branchesToMergeStr}`);
tl.debug(`branchToMergeInto: ${branchToMergeInto}`);
tl.debug(`testMergeAll: ${testMergeAll}`);
tl.debug(`remoteName: ${remoteName}`);
tl.debug(`buildSourceBranch: ${buildSourceBranch}`);
tl.debug(`commitId: ${commitId}`);

tl.cd(tl.getVariable("Build.SourcesDirectory"));

// fetch the remote branches
var res = ut.execGit(["fetch", remoteName]);

if (mergeType === "test") {
    var branchesToMerge = branchesToMergeStr.split(',');
    console.info(`Found ${branchesToMerge.length} branches to test`);
    
    // pull all the branches that we're testing down so that they are locally
    // (by default TFS doesn't pull all remote branches)
    var errors = 0;
    for (var i = 0; i < branchesToMerge.length; i++) {
        var branch = branchesToMerge[i].trim();
        
        // make sure the branch exists locally
        if (!ut.pullBranch(remoteName, branch, commitId)) {
            errors ++;
            continue;
        }
    }
    
    // we couldn't get all the branches, so fail
    if (errors) {
        tl.exit(1);
    }
    
    // make sure that we're on the repo commit before continuing
    if (!ut.checkoutCommit(commitId)) {
        tl.exit(1);
    }
    
    // now that all the branches are local, test the merges
    errors = 0;
    for (var i = 0; i < branchesToMerge.length; i++) {
        var branch = branchesToMerge[i].trim();
        
        if (ut.merge(branch, false)) {
            console.info(`No merge conflicts detected when merging ${branch}`);
            
            if (testMergeAll) {
                // if we're testing all the merges, then we need to commit before
                // merging the next branch
                if (!ut.commit("Testing merge")) {
                    errors++;
                    tl.error("Commit failed");
                    break;
                }
            } else {
                ut.abortMerge();
            }
        } else {
            errors++;
            tl.error(`Merge ${branch} operation has conflicts (or failed)`);
        }
    }
    
    // clean up
    ut.checkoutCommit(commitId);
    
    // fail the task if there were errors
    if (errors > 0) {
        tl.exit(1);
    }
} else {
    tl.debug(`Checking out ${branchToMergeInto}`);
    if (!ut.pullBranch(remoteName, branchToMergeInto)) {
        tl.exit(1);
    }
    
    var buildNo = tl.getVariable("Build.BuildNumber");
    var buildName = tl.getVariable("Build.DefinitionName");
    var build = `${buildName}-${buildNo}`;
    tl.debug(`Merging commit ${commitId}`);
    if (ut.mergeCommit(commitId, `Merging in build ${build}`)) {
        if (!ut.push(remoteName, branchToMergeInto)) {
            tl.exit(1);
        }
    } else {
        ut.resetHead();
        tl.exit(1);
    }
}

tl.debug("Leaving Git Merge task");