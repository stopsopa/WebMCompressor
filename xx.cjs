// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fbash%2Fxx%2Fxx-template.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/xx/xx-template.cjs

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  

        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

-- DEV NOTES --
you can always stop github actions execution which was triggered on push and run manually:
"Build & Release Pipeline" - pipeline
  and untick the flag "Run official Electron build steps (QA & Release)?"
  that will always speed up the process.
  but do this only when you know build will succeed and you don't need QA builds.
  at the end of this pipeline the last step will push to gh-pages branch. and that should release to gh pages

You can always trigger workflow "Deploy branches to GitHub Pages" to release download helper manually.
  you have to be careful though picking the branch and the tag


EEE

      `,
      description: "Status of all things",
      source: false,
      confirm: false,
    },
    [`npm`]: {
      command: `
cat <<EEE

npm install -g c8 

EEE

`,
      description: `npm`,
      confirm: false,
    },
    [`ts`]: {
      command: `
cat <<EEE

/bin/bash ts.sh [path to *.ts file]

EEE

`,
      description: `run typescript`,
      confirm: false,
    },
    [`test`]: {
      command: `
cat <<EEE

/bin/bash ts.sh --test
/bin/bash ts.sh --test electron/tools/categorizeFrameRate.test.ts

EEE

`,
      description: `test`,
      confirm: false,
    },
    [`coverage`]: {
      command: `   
FILE="coverage/index.html"
if [ ! -f "\${FILE}" ]; then

  cat <<EEE

  file >\${FILE}< doesn't exist
  
  to generate manually

EEE
  
  exit 1
fi  

FILE="file://\$(realpath "\${FILE}")"   

cat <<EEE

Ways to open:
    open "\${FILE}"
    open -a "Google Chrome" "\${FILE}"

EEE

echo -e "\\n      Press enter to continue\\n"
read

open "\${FILE}"
      `,
      confirm: false,
    },

    ...setup,
  };
};
