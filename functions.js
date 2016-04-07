var tl = require('vso-task-lib/vsotask');
function execGit(gitArgs) {
    var gitTool = tl.createToolRunner(tl.which("git", true));
    var opts = {
        failOnStdErr: true
    };
    gitTool.arg(gitArgs);
    return gitTool.execSync(opts);
}
exports.execGit = execGit;
function checkoutCommit(commitId) {
    tl.debug("Checking out commit " + commitId);
    var res = execGit(["checkout", commitId]);
    if (res.code !== 0) {
        tl.error("Could not checkout " + commitId);
        return false;
    }
    return true;
}
exports.checkoutCommit = checkoutCommit;
function resetHead() {
    tl.debug("Resetting HEAD");
    var res = execGit(["reset", "--hard", "HEAD^"]);
    if (res.code !== 0) {
        tl.error("Could not reset HEAD");
        return false;
    }
    return true;
}
exports.resetHead = resetHead;
function mergeCommit(commitId, message) {
    tl.debug("Merging commit " + commitId);
    var gitArgs = ["merge", commitId];
    if (message) {
        gitArgs.push("-m", message);
    }
    return execGit(gitArgs).code === 0;
}
exports.mergeCommit = mergeCommit;
function merge(branch, commit) {
    if (commit === void 0) { commit = false; }
    tl.debug("Merging " + branch + " with commit = " + commit);
    var gitArgs = ["merge"];
    if (!commit) {
        gitArgs.push("--no-commit", "--no-ff");
    }
    gitArgs.push(branch);
    var res = execGit(gitArgs);
    if (res.code !== 0 && !commit) {
        abortMerge();
        return false;
    }
    return res.code === 0;
}
exports.merge = merge;
function abortMerge() {
    tl.debug("Aborting merge");
    return execGit(["merge", "--abort"]).code === 0;
}
exports.abortMerge = abortMerge;
function commit(message) {
    tl.debug("Committing with message " + message);
    return execGit(["commit", "-m", ("\"" + message + "\"")]).code === 0;
}
exports.commit = commit;
function push(remoteName, branchToMergeInto) {
    tl.debug("Pushing local commits");
    return execGit(["push", remoteName, ("HEAD:" + branchToMergeInto)]).code === 0;
}
exports.push = push;
function pullBranch(remoteName, branch, commitId) {
    tl.debug("Checking if branch " + branch + " exists locally");
    var localBranchExists = false;
    var res = execGit(["branch"]);
    if (res.code !== 0) {
        tl.error("Could not execute [git branch]");
        return false;
    }
    else {
        var branchList = res.stdout.toString('utf-8');
        localBranchExists = branchList.indexOf(branch + "\n") > -1;
    }
    var remoteBranch = remoteName + "/" + branch;
    if (!localBranchExists) {
        // check branch out from origin
        tl.debug("Checking out and tracking remote branch: " + remoteBranch);
        res = execGit(["checkout", "--track", remoteBranch]);
        if (res.code !== 0) {
            tl.error("Could not checkout remote branch " + remoteBranch);
            return false;
        }
        // after pulling the branch, we need to revert to the original commit
        if (commitId) {
            return checkoutCommit(commitId);
        }
    }
    else {
        // if the branch exists locally, then make sure it's up to date
        tl.debug("Resetting branch " + branch);
        return execGit(["reset", "--hard", remoteBranch]).code === 0;
    }
    return true;
}
exports.pullBranch = pullBranch;
