import Q = require('q');
import * as tl from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import * as fs from 'fs';

export async function execGit(gitArgs: string[]) : Promise<number> {
    let gitTool = new ToolRunner(tl.which("git",true));
    if (!gitTool) {
        throw new Error(tl.loc('Git not found'));
    }
    
    gitTool.arg(gitArgs);
    try {
        return await gitTool.exec();
    }
    catch (err) {
        tl.debug('execGit failed');
        tl.setResult(tl.TaskResult.Failed, tl.loc('Git exe failed to run', err.message));
    }
}
 export function execGitSync(gitArgs: string[]) : any  {
    let gitTool = new ToolRunner(tl.which("git",true));
    if (!gitTool) {
        throw new Error(tl.loc('Git not found'));
    }
    
    gitTool.arg(gitArgs);
    try {
        let obj:any = gitTool.execSync(); 
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
    let res:any = this.execGitSync(["clone", url]);
    if (res.code !== 0) {
        tl.error(`Could not clone ${repoUrl}`);
        return false;
    }
    return true;

    /*
    return this.execGit(["clone", url]).then(res => {
        if (res !== 0) {
            tl.error(`Could not clone ${repoUrl}`);
            return false;
        }
        return true;
    
    });
    */
}

function getUrlWithToken(repoUrl: string, pat: string): string {
    var url = repoUrl;
    if (!isEmpty(pat)) {
        var idx = url.indexOf("//") + 2;
        url = [repoUrl.slice(0, idx), `pat:${pat}@`, repoUrl.slice(idx)].join('');
    }
    return url;
}

export function checkoutBranch(branch: string): boolean {
    tl.debug(`Checkout ${branch}`);
    let res:number
    return this.execGit(["checkout", branch]).then(res => {
        if (res !== 0) {
            tl.error(`Could not checkout ${branch}`);
            return false;
        }
        return true;
    
    });
}

export function checkoutCommit(commitId: string): boolean {
    tl.debug(`Checking out commit ${commitId}`);
    
    let res:number;
    return this.execGit(["checkout", commitId]).then(res => {
        if (res !== 0) {
            tl.error(`Could not checkout ${commitId}`);
            return res === -1;
        }
        return res === 0;
    
    });
}

export function resetHead(): boolean {
    tl.debug("Resetting HEAD");
    
    let res:number;
    return this.execGit(["reset", "--hard", "HEAD^"]).then(res => {
        if (res !== 0) {
            tl.error(`Could not reset HEAD`);
            return res === -1;
        }
        return res === 0;
    
    });
}

export function mergeCommit(commitId: string, message?: string): boolean {
    tl.debug(`Merging commit ${commitId}`);
    var gitArgs = ["merge", commitId];
    if (message) {
        gitArgs.push("-m", message);
    }
    let result:number;
    return this.execGit(gitArgs).then(result => {
        return result === 0;
        
    });
}

export function merge(branch: string, commit = false): any{
    tl.debug(`Merging ${branch} with commit = ${commit}`);
    
    var gitArgs = ["merge"];
    if (!commit) {
        gitArgs.push("--no-commit", "--no-ff");
    }
    gitArgs.push(branch);
    
   
    let res:any = this.execGitSync(gitArgs);
    // abort the merge, but only if not up-to-date, or we're not committing or it failed
    // removed this from evaluation for now:
    // && 
    if (res.code !== 0 && !commit && res.stdout.indexOf('Already up-to-date') < 0) {
        abortMerge();
    }
    return res;
}

export function abortMerge() {
    tl.debug("Aborting merge");
    let res:number;
    return this.execGit(["merge", "--abort"]).then(res => {
        return Boolean(res);
        
    });
}

export function commit(message: string): boolean {
    tl.debug(`Committing with message ${message}`);
    let res:number;
    return this.execGit(["commit", "-m", `"${message}"`]).then(res =>{
        return Boolean(res);
        
    })
}

export function push(remoteName: string, branchToMergeInto: string): boolean {
    tl.debug(`Pushing local commits`);
    let res:number;
    return this.execGit(["push", remoteName, `HEAD:${branchToMergeInto}`]).then(res =>{
        return Boolean(res);
        
    });
}

export function pullBranch(remoteName: string, branch: string, commitId?: string): boolean {
    tl.debug(`Checking if branch ${branch} exists locally`);
    var localBranchExists = false;
    let res:any = this.execGitSync(["branch"]);
    
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
        let res2 = execGitSync(["checkout", "--track", remoteBranch]);
        if (res2.code !== 0) {
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
        let res3:any = execGit(["reset", "--hard", remoteBranch]);
        return Boolean(res.code);
    }
    return true;
}

export function setRemote(repoUrl: string, token: string, remoteName: string): boolean {
    tl.debug(`Setting remote ${remoteName} for repo ${repoUrl}`);
    var url = getUrlWithToken(repoUrl, token);
    let res:number;
    return this.execGit(["remote", "set-url", remoteName, url]).then(res => {
        return Boolean(res);
        
    });
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