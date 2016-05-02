##Task Installation Instructions

1. Install the [tfx-cli tool](https://github.com/Microsoft/tfs-cli)
>  Note: When you login, make sure to use the https://youraccount.visualstudio.com/DefaultCollection URL

1. Install this vsts task dependencies
  <br> From the root of this repo simply execute: 
  <br> `npm install`

1. Upload the task to your repository
  <br> From the root of this repository, execute: 
  <br> `tfx build tasks upload --task-path .\` 
  <br> You should see a message which states that the task uploaded successfully.

Now you can see the "Git Merge" utility task available to add via build or release.
> Note: If you are updating the task code, you will need to remove old tasks and recreate the tasks again.
