// import octokit library for making API calls to GitHub
import { getOctokit } from "@actions/github";
import { setFailed } from "@actions/core";


/* import { getProperties } from 'properties-file' */

// Repo Owner Name
const owner = "SAG-Trial";


// Repo Name 
const repo = "QM";

async function readFileContents() {

  //headers for download the password file
  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/vnd.github+json");


  // Create an octokit instance with API token
  const octokit = getOctokit(process.env.SECRET_SSH_KEY as string);

  // file name to be read containing password
  const path = "config.json";

  try {

    // get the latest commit SHA for finding SubModule (IGNORE THIS)
    const headCommitSHA = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: "main",
    });

    // get the tree of the commit for getting submodule (IGNORE THIS)
    const repoDirArray = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: headCommitSHA.data.commit.tree.sha,
    });


    // get the submodule name from the tree : In github submodules have type 160000 (IGNORE THIS)
    const subModuleDetails = repoDirArray.data.tree.filter(
      (item) => item.mode === "160000"
    );

    try {

      // Reading the contents from Submoduke repo where the password file is stored . This returns a base64 encoded string which is not practical. So we will take download_url and fetch the contents from there directly in right format
      const configContents = await octokit.rest.repos.getContent({
        owner,
        repo: subModuleDetails[0].path as string,
        path,
      });

      //@ts-ignore

      // Get download_url from configContents
      const downloadUrl = configContents.data.download_url;
      
      //@ts-ignore
      //download the file from the download_url and fetch the contents as JSON
      const response = await fetch(
        downloadUrl,
        {
          method: "GET",
          headers: myHeaders,
        }
      )

      // if password file is .properties type then use this
      // const passwordObject =getProperties(await response.text());


      // if Password file is .json type then use this
      const passwordObject = await response.json();

      console.log(passwordObject);

      //verifying the type of passwordObject
      console.log("typeof passwordObject", typeof passwordObject);

      // printing the passwords
      console.log(passwordObject.passwords);

      //printing the password for db_password
      console.log(passwordObject.passwords["db_password"]);

    } catch (error) {
      setFailed((error as Error).message);
    }
  } catch (error) {
    setFailed((error as Error).message);
  }
}

readFileContents();

