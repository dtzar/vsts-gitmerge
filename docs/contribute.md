# Local Task Development

Pull request contributions to enhance, repair, or improve this task are welcome. Please [see this website](https://www.visualstudio.com/en-us/docs/integrate/extensions/overview) for a starting place on VSTS task development.

The below instructions are an easy reference to install and remove the task on your own VSTS/TFS account when doing local development and testing of the task itself. If you want to simply use the task in your own account, please install [this task via the public marketplace](https://marketplace.visualstudio.com/items?itemName=dtzar.git-merge).

## Task Installation

1. Install the [tfx-cli tool](https://github.com/Microsoft/tfs-cli)
> Note: When you login, make sure to use the https://youraccount.visualstudio.com/DefaultCollection URL

> Note: You have to be a member of the Team Foundation Administrators in order to upload the task.

1. Install this vsts task dependencies
  <br> From the root of this repo simply execute:
  <br> `npm install`

1. Upload the task to your VSTS account
  <br> From the root of this repository, execute:
  <br> `tfx build tasks upload --task-path .\GitMerge`
  <br> You should see a message which states that the task uploaded successfully.

Now you can see the "Git Merge" utility task available to add via build or release.
> Note: If you are updating the task code and publishing to your account, you may need to remove old tasks and recreate the tasks again.

## Task Removal

1. Get information about the installed build task
   <br> Execute `tfx build tasks list`
   <br> You should find the git-merge task in the list:
   ```
    id            : e927ed99-f19e-4c55-9e87-ccf0409b4689
    name          : gitMerge
    friendly name : Git Merge
    visibility    : Build,Release
    description   : Test merges and optionally commit
    version       : 0.0.52
   ```

1. Delete the task
  <br> Replace the task.id with the value from the previous step and then execute `tfx build tasks delete --task.id e927ed99-f19e-4c55-9e87-ccf0409b4689`