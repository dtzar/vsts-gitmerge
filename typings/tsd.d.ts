/// <reference path="q/Q.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="shelljs/shelljs.d.ts" />
/// <reference path="vso-task-lib/vso-task-lib.d.ts" />

declare module "vso-task-lib" {
	export * from 'vso-task-lib/vsotask';
	export * from 'vso-task-lib/taskcommand';
	export * from 'vso-task-lib/toolrunner';
}