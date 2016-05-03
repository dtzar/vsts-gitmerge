import * as tl from 'vso-task-lib/vsotask';
import * as tr from 'vso-task-lib/toolrunner';
import * as ut from './functions';

tl.debug("Starting 'Git Merge' task");

// get the task vars
var mergeType = tl.getInput("mergeType", true);
var branchesToMergeStr = tl.getInput("branchesToTest", false);
var testMergeAll = tl.getBoolInput("testMergeAll", true);
var targetBranch = tl.getInput("targetBranch", true);
var sourceCommitId = tl.getInput("sourceCommitId", false);
var remoteName = tl.getInput("remoteName", true);

// ===================================================================================================
// TODO: repoUrl could actually be determined as follows:
// var tfsUri = tl.getVariable("System.TeamFoundationServerURI");
// var tfsProject = tl.getVariable("System.TeamProject");
// var repoName = tl.getVariable("Build.RepositoryName");
// var repoUrl = `${tfsUri}/${tfsProject}/${repoName}`;
// unfortunately, the repo name isn't correct in the release vars, so the user must pass it in for now
// also, if the user uses a Github repo, we may want to leave the option to specify the url and PAT?
// ===================================================================================================
var repoUrl = tl.getInput("repoUrl", true);
var pat = tl.getInput("pat", false);

// get build vars
var sourceBranch = tl.getVariable("Build.SourceBranchName");
var buildSourceCommitId = tl.getVariable("Build.SourceVersion");
var token = tl.getVariable('System.AccessToken');

tl.debug(`mergeType: ${mergeType}`);
tl.debug(`branchesToMerge: ${branchesToMergeStr}`);
tl.debug(`targetBranch: ${targetBranch}`);
tl.debug(`testMergeAll: ${testMergeAll}`);
tl.debug(`sourceCommitId: ${sourceCommitId}`);
tl.debug(`remoteName: ${remoteName}`);
tl.debug(`sourceBranch: ${sourceBranch}`);
tl.debug(`buildSourceCommitId: ${buildSourceCommitId}`);
tl.debug(`repoUrl: ${repoUrl}`);
if (ut.isEmpty(pat)) {
    tl.debug("No PAT was provided");
} else {
    tl.debug("A PAT was provided");
}
if (ut.isEmpty(token)) {
    tl.debug(`The system Oauth token is NOT present`);
} else {
    tl.debug(`The system Oauth token is present`);
}

if (ut.isEmpty(sourceCommitId)) {
    tl.debug(`Using buid source commit id ${buildSourceCommitId} as the commit id`);
    sourceCommitId = buildSourceCommitId;
}

var sourceDir = tl.getVariable("Build.SourcesDirectory");
if (ut.isEmpty(sourceDir)) {
    // cd to the agent release dir
    var sourceDir = tl.getVariable("Agent.ReleaseDirectory");
    tl.cd(sourceDir);
    // create a new dir for the source
    tl.mkdirP("__s");
    tl.cd("__s");
    if (!ut.cloneRepo(repoUrl, pat)) {
        tl.exit(1);
    }
    // cd to the repo directory
    tl.cd(ut.findSubdirs(process.cwd())[0]);
    tl.debug(`Working dir: ${process.cwd()}`);
} else {
    tl.cd(sourceDir);
    // set the remote creds using the token
    if (ut.isEmpty(token)) {
        tl.warning("Could not find System.AccessToken. Attempting to continue - if credentials fail, then please enable the token in the build Options page.");
    } else {
        ut.setRemote(repoUrl, token, remoteName);
    }
}

// fetch the remote branches
if (ut.execGit(["fetch", remoteName]).code !== 0) {
    tl.exit(1);
}

if (mergeType === "test") {
    var branchesToMerge = branchesToMergeStr.split(',');
    console.info(`Found ${branchesToMerge.length} branches to test`);
    
    // pull all the branches that we're testing down so that they are locally
    // (by default TFS doesn't pull all remote branches)
    var errors = 0;
    for (var i = 0; i < branchesToMerge.length; i++) {
        var branch = branchesToMerge[i].trim();
        
        // make sure the branch exists locally
        if (!ut.pullBranch(remoteName, branch, sourceCommitId)) {
            errors ++;
            continue;
        }
    }

    // we couldn't get all the branches, so fail
    if (errors) {
        tl.exit(1);
    }
    
    // make sure that we're on the repo commit before continuing
    if (!ut.checkoutCommit(sourceCommitId)) {
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
    ut.checkoutCommit(sourceCommitId);
    
    // fail the task if there were errors
    if (errors > 0) {
        tl.exit(1);
    }
} else {
    // pull the source and target branches
    if (!ut.pullBranch(remoteName, sourceBranch) || !ut.pullBranch(remoteName, targetBranch)){
        tl.exit(1);
    }
    
    // checkout the targetBranch
    if (!ut.checkoutBranch(targetBranch)) {
        tl.exit(1);
    }
    
    // build a message to point to build or release
    var identifier = "build or release";
    var releaseDefName = tl.getVariable("Release.DefinitionName");
    if (ut.isEmpty(releaseDefName)) {
        var releaseName = tl.getVariable("Release.ReleaseName");
        identifier = `release ${releaseDefName} (${releaseName})`;
    } else {
        var buildName = tl.getVariable("Build.DefinitionName");
        var buildNo = tl.getVariable("Build.BuildNumber");
        var identifier = `build ${buildName} (${buildNo})`;
    }
    var commitMessage = `Merging in ${identifier}`;
    
    // merge in the commit id and push
    if (ut.mergeCommit(sourceCommitId, commitMessage)) {
        if (!ut.push(remoteName, targetBranch)) {
            tl.exit(1);
        }
    } else {
        tl.error(`Could not merge ${sourceCommitId} into ${targetBranch}. Possibley a merge conflict?`)
        ut.resetHead();
        tl.exit(1);
    }
}

tl.debug("Leaving Git Merge task");