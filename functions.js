var tl = require('vso-task-lib/vsotask');
var fs = require('fs');
function execGit(gitArgs) {
    var gitTool = tl.createToolRunner(tl.which("git", true));
    var opts = {
        failOnStdErr: true
    };
    gitTool.arg(gitArgs);
    return gitTool.execSync(opts);
}
exports.execGit = execGit;
function cloneRepo(repoUrl, pat) {
    if (pat === void 0) { pat = ""; }
    var url = getUrlWithToken(repoUrl, pat);
    var res = execGit(["clone", url]);
    if (res.code !== 0) {
        tl.error("Could not clone " + repoUrl);
        return false;
    }
    return true;
}
exports.cloneRepo = cloneRepo;
function getUrlWithToken(repoUrl, pat) {
    var url = repoUrl;
    if (!isEmpty(pat)) {
        var idx = url.indexOf("//") + 2;
        url = [repoUrl.slice(0, idx), ("pat:" + pat + "@"), repoUrl.slice(idx)].join('');
    }
    return url;
}
function checkoutBranch(branch) {
    tl.debug("Checkout " + branch);
    var res = execGit(["checkout", branch]);
    if (res.code !== 0) {
        tl.error("Could not checkout " + branch);
        return false;
    }
    return true;
}
exports.checkoutBranch = checkoutBranch;
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
function setRemote(repoUrl, token, remoteName) {
    tl.debug("Setting remote " + remoteName + " for repo " + repoUrl);
    var url = getUrlWithToken(repoUrl, token);
    return execGit(["remote", "set-url", remoteName, url]).code === 0;
}
exports.setRemote = setRemote;
function isEmpty(s) {
    return typeof s === "undefined" || s === null || s === "";
}
exports.isEmpty = isEmpty;
function findSubdirs(path) {
    return fs.readdirSync(path).filter(function (d, i, a) {
        var subDir = path + "/" + d;
        return fs.statSync(subDir).isDirectory();
    });
}
exports.findSubdirs = findSubdirs;
