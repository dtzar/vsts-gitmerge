"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Q = require("q");
var tl = require("vsts-task-lib/task");
var fs = require("fs");
function execGit(gitArgs) {
    return __awaiter(this, void 0, void 0, function () {
        var gitTool, res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gitTool = tl.tool(tl.which("git", true));
                    if (!gitTool) {
                        throw new Error(tl.loc('Git not found'));
                    }
                    gitTool.arg(gitArgs);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, gitTool.exec()];
                case 2:
                    res = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    tl.debug('execGit failed');
                    tl.setResult(tl.TaskResult.Failed, tl.loc('GitFailed', err_1.message));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, Q(res)];
            }
        });
    });
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
        url = [repoUrl.slice(0, idx), "pat:" + pat + "@", repoUrl.slice(idx)].join('');
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
    // abort the merge, but only if not up-to-date, or we're not committing or it failed
    if (res.code !== 0 && !commit && res.stdout.indexOf('Already up-to-date') < 0) {
        abortMerge();
    }
    return res;
}
exports.merge = merge;
function abortMerge() {
    tl.debug("Aborting merge");
    return execGit(["merge", "--abort"]).code === 0;
}
exports.abortMerge = abortMerge;
function commit(message) {
    tl.debug("Committing with message " + message);
    return execGit(["commit", "-m", "\"" + message + "\""]).code === 0;
}
exports.commit = commit;
function push(remoteName, branchToMergeInto) {
    tl.debug("Pushing local commits");
    return execGit(["push", remoteName, "HEAD:" + branchToMergeInto]).code === 0;
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
