DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# add --watch flag for dev mode

source "${DIR}/.env.sh"

set -e

export NODE_NO_WARNINGS=1

# add to gitignore /coverage/
# require ts-resolver.js
# require node-suppress-warning.js
# require node.config.json

if [[ "${@}" == *"--test"* ]]; then
  rm -rf "${DIR}/coverage"
  # without c8 ... - test will work like nothing happened but coverage directory won't be created
  # requires c8 (npx will handle it)
  npx c8 --reporter=lcov --reporter=html --reporter=text \
    node --experimental-config-file="${DIR}/node.config.json" --experimental-loader="${DIR}/ts-resolver.js" --import file://${DIR}/node-suppress-warning.js ${@}
else
    node --experimental-config-file="${DIR}/node.config.json" --experimental-loader="${DIR}/ts-resolver.js" --import file://${DIR}/node-suppress-warning.js ${@}
fi
