/// <reference path="q/Q.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="shelljs/shelljs.d.ts" />
/// <reference path="vsts-task-lib/vsts-task-lib.d.ts" />

declare module "vsts-task-lib" {
	export * from 'vsts-task-lib/task';
	export * from 'vsts-task-lib/taskcommand';
	export * from 'vsts-task-lib/toolrunner';
}