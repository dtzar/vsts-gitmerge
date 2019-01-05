import * as tl from 'azure-pipelines-task-lib/task';
import { IExecOptions, IExecSyncResult, ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import * as fs from 'fs';

export function execGit(gitArgs: string[], options?: IExecOptions): IExecSyncResult {
    let gitTool =  new ToolRunner(tl.which("git", true));
    gitTool.arg(gitArgs);
    options = options || <IExecOptions>{};
    try {
        let obj:any = gitTool.execSync(options);
        return obj;
    }
    catch (err) {
        tl.debug('execGit failed');
        tl.setResult(tl.TaskResult.Failed, tl.loc('Git exe failed to run', err.message));
    }
    return;
}

export function cloneRepo(repoUrl: string, pat: string = ""): boolean {
    var url = getUrlWithToken(repoUrl, pat);

    var res = execGit(["clone", url]);
    if (res.code !== 0) {
        tl.error(`Could not clone ${repoUrl}`);
        return false;
    }
    return true;
}

function getUrlWithToken(repoUrl: string, pat: string): string {
    var url = repoUrl;
    if (!isEmpty(pat)) {
        var idx = url.indexOf("//") + 2;
        url = [repoUrl.slice(0, idx), `pat:${pat}@`, repoUrl.slice(idx)].join('');
    } else {
        tl.error('No PAT or OAuth token found.');
    }
    tl.debug(`The new URL with token is: ${url}`)
    return url;
}

export function checkoutBranch(branch: string): boolean {
    tl.debug(`Checkout ${branch}`);
    
    var res = execGit(["checkout", branch]);
    if (res.code !== 0) {
        tl.error(`Could not checkout ${branch}`);
        return false;
    }
    return true;
}

export function checkoutCommit(commitId: string): boolean {
    tl.debug(`Checking out commit ${commitId}`);
    
    var res = execGit(["checkout", commitId]);
    if (res.code !== 0) {
        tl.error(`Could not checkout ${commitId}`);
        return false;
    }
    return true;
}

export function resetHead(): boolean {
    tl.debug("Resetting HEAD");
    
    var res = execGit(["reset", "--hard", "HEAD^"]);
    if (res.code !== 0) {
        tl.error(`Could not reset HEAD`);
        return false;
    }
    return true;
}

export function mergeCommit(commitId: string, message?: string): boolean {
    tl.debug(`Merging commit ${commitId}`);
    var gitArgs = ["merge", commitId];
    if (message) {
        gitArgs.push("-m", message);
    }
    return execGit(gitArgs).code === 0;
}

export function merge(branch: string, commit = false): IExecSyncResult {
    tl.debug(`Merging ${branch} with commit = ${commit}`);

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

export function abortMerge() {
    tl.debug("Aborting merge");
    
    return execGit(["merge", "--abort"]).code === 0
}

export function commit(message: string): boolean {
    tl.debug(`Committing with message ${message}`);
    return execGit(["commit", "-m", `"${message}"`]).code === 0;
}

export function push(remoteName: string, branchToMergeInto: string): boolean {
    tl.debug(`Pushing local commits`);
    return execGit(["push", remoteName, `HEAD:${branchToMergeInto}`]).code === 0;
}

export function pullBranch(remoteName: string, branch: string, commitId?: string): boolean {
    tl.debug(`Checking if branch ${branch} exists locally`);
    var localBranchExists = false;
    var res = execGit(["branch"]);
    if (res.code !== 0) {
        tl.error(`Could not execute [git branch]`);
        return false;
    } else {
        var branchList: string = (<any>res.stdout).toString('utf-8');
        localBranchExists = branchList.indexOf(`${branch}\n`) > -1;
    }
    
    var remoteBranch = `${remoteName}/${branch}`;
    if (!localBranchExists) {
        // check branch out from origin
        tl.debug(`Checking out and tracking remote branch: ${remoteBranch}`)
        res = execGit(["checkout", "--track", remoteBranch]);
        if (res.code !== 0) {
            tl.error(`Could not checkout remote branch ${remoteBranch}`);
            return false;
        }
        
        // after pulling the branch, we need to revert to the original commit
        if (commitId) {
            return checkoutCommit(commitId);
        }
    } else {
        // if the branch exists locally, then make sure it's up to date
        tl.debug(`Resetting branch ${branch}`);
        return execGit(["reset", "--hard", remoteBranch]).code === 0;
    }
    return true;
}

export function setRemote(repoUrl: string, pat: string = "", remoteName: string): boolean {
    tl.debug(`Setting remote ${remoteName} for repo ${repoUrl} with ${pat}`);
    var url = getUrlWithToken(repoUrl, pat);
    
    return execGit(["remote", "set-url", remoteName, url]).code === 0;
}

export function isEmpty(s: string): boolean {
    return typeof s === "undefined" || s === null || s === "";
}

export function findSubdirs(path: string): string[] {
    return fs.readdirSync(path).filter((d, i, a) => {
        var subDir = `${path}/${d}`;
        return fs.statSync(subDir).isDirectory();
    });
}

export function setGitCredentials(username: string, useremail: string): boolean {
    tl.debug(`Setting global git user credentials for the task session`);
    var res = execGit(["config","--global","user.name", username]);
    if (res.code !== 0) {
        tl.error(`Could not set git config user.name`);
        return false;
    }
    var res = execGit(["config", "--global", "user.email", useremail]);
    if (res.code !== 0) {
        tl.error(`Could not set git config user.email`);
        return false;
    }
    return true;
}