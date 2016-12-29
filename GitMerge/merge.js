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
var tl = require("vsts-task-lib/task");
var ut = require("./functions");
run();
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var mergeType, branchesToMergeStr, testMergeAll, targetBranch, sourceCommitId, remoteName, repoUrl, pat, sourceBranch, buildSourceCommitId, token, sourceDir, sourceDir, res, branchesToMerge, errors, i, branch, i, branch, mergeRes, identifier, releaseDefName, releaseName, buildName, buildNo, identifier, commitMessage, msg;
        return __generator(this, function (_a) {
            try {
                tl.debug("Starting 'Git Merge' task");
                mergeType = tl.getInput("mergeType", true);
                branchesToMergeStr = tl.getInput("branchesToTest", false);
                testMergeAll = tl.getBoolInput("testMergeAll", true);
                targetBranch = tl.getInput("targetBranch", true);
                sourceCommitId = tl.getInput("sourceCommitId", false);
                remoteName = tl.getInput("remoteName", true);
                repoUrl = tl.getInput("repoUrl", true);
                pat = tl.getInput("pat", false);
                sourceBranch = tl.getVariable("Build.SourceBranchName");
                buildSourceCommitId = tl.getVariable("Build.SourceVersion");
                token = tl.getVariable('System.AccessToken');
                tl.debug("mergeType: " + mergeType);
                tl.debug("branchesToMerge: " + branchesToMergeStr);
                tl.debug("targetBranch: " + targetBranch);
                tl.debug("testMergeAll: " + testMergeAll);
                tl.debug("sourceCommitId: " + sourceCommitId);
                tl.debug("remoteName: " + remoteName);
                tl.debug("sourceBranch: " + sourceBranch);
                tl.debug("buildSourceCommitId: " + buildSourceCommitId);
                tl.debug("repoUrl: " + repoUrl);
                if (ut.isEmpty(pat)) {
                    tl.debug("No PAT was provided");
                }
                else {
                    tl.debug("A PAT was provided");
                }
                if (ut.isEmpty(token)) {
                    tl.debug("The system Oauth token is NOT present");
                }
                else {
                    tl.debug("The system Oauth token is present");
                }
                if (ut.isEmpty(sourceCommitId)) {
                    tl.debug("Using buid source commit id " + buildSourceCommitId + " as the commit id");
                    sourceCommitId = buildSourceCommitId;
                }
                sourceDir = tl.getVariable("Build.SourcesDirectory");
                if (ut.isEmpty(sourceDir)) {
                    sourceDir = tl.getVariable("Agent.ReleaseDirectory");
                    tl.cd(sourceDir);
                    // create a new dir for the source
                    tl.mkdirP("__s");
                    tl.cd("__s");
                    if (!ut.cloneRepo(repoUrl, pat)) {
                        tl.exit(1);
                    }
                    // cd to the repo directory
                    tl.cd(ut.findSubdirs(process.cwd())[0]);
                    tl.debug("Working dir: " + process.cwd());
                }
                else {
                    tl.cd(sourceDir);
                    // set the remote creds using the token
                    if (ut.isEmpty(token)) {
                        tl.warning("Could not find System.AccessToken. Attempting to continue - if credentials fail, then please enable the token in the build Options page.");
                    }
                    else {
                        ut.setRemote(repoUrl, token, remoteName);
                    }
                }
                // fetch the remote branches
                try {
                    res = ut.execGit(["fetch", remoteName]);
                    if (res.code !== 0) {
                        tl.error("Could not fetch " + remoteName);
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, true];
                }
                catch (err) {
                    tl.error('unable to fetch remotes');
                }
                if (mergeType === "test") {
                    branchesToMerge = branchesToMergeStr.split(',');
                    console.info("Found " + branchesToMerge.length + " branches to test");
                    errors = 0;
                    for (i = 0; i < branchesToMerge.length; i++) {
                        branch = branchesToMerge[i].trim();
                        // make sure the branch exists locally
                        if (!ut.pullBranch(remoteName, branch, sourceCommitId)) {
                            errors++;
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
                    for (i = 0; i < branchesToMerge.length; i++) {
                        branch = branchesToMerge[i].trim();
                        mergeRes = ut.merge(branch, false);
                        if (mergeRes.code === 0) {
                            console.info("No merge conflicts detected when merging " + branch);
                            if (testMergeAll) {
                                // if we're testing all the merges, then we need to commit before
                                // merging the next branch
                                if (!ut.commit("Testing merge")) {
                                    errors++;
                                    tl.error("Commit failed");
                                    break;
                                }
                            }
                            else {
                                if (mergeRes.stdout.indexOf('Already up-to-date') < 0) {
                                    ut.abortMerge();
                                }
                            }
                        }
                        else {
                            errors++;
                            tl.error("Merge " + branch + " operation has conflicts (or failed)");
                        }
                    }
                    // clean up
                    ut.checkoutCommit(sourceCommitId);
                    // fail the task if there were errors
                    if (errors > 0) {
                        tl.exit(1);
                    }
                }
                else {
                    // pull the source and target branches
                    if (!ut.pullBranch(remoteName, sourceBranch) || !ut.pullBranch(remoteName, targetBranch)) {
                        tl.exit(1);
                    }
                    // checkout the targetBranch
                    if (!ut.checkoutBranch(targetBranch)) {
                        tl.exit(1);
                    }
                    identifier = "build or release";
                    releaseDefName = tl.getVariable("Release.DefinitionName");
                    if (ut.isEmpty(releaseDefName)) {
                        releaseName = tl.getVariable("Release.ReleaseName");
                        identifier = "release " + releaseDefName + " (" + releaseName + ")";
                    }
                    else {
                        buildName = tl.getVariable("Build.DefinitionName");
                        buildNo = tl.getVariable("Build.BuildNumber");
                        identifier = "build " + buildName + " (" + buildNo + ")";
                    }
                    commitMessage = "Merging in " + identifier;
                    // merge in the commit id and push
                    if (ut.mergeCommit(sourceCommitId, commitMessage)) {
                        if (!ut.push(remoteName, targetBranch)) {
                            tl.exit(1);
                        }
                    }
                    else {
                        tl.error("Could not merge " + sourceCommitId + " into " + targetBranch + ". Check to ensure no merge conflicts.");
                        ut.resetHead();
                        tl.exit(1);
                    }
                }
            }
            catch (err) {
                msg = err;
                if (err.message) {
                    msg = err.message;
                }
                tl.setResult(tl.TaskResult.Failed, msg);
            }
            tl.debug("Leaving Git Merge task");
            return [2 /*return*/];
        });
    });
}
