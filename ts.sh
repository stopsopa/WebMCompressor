
# add --watch flag for dev mode

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "${DIR}/.env.sh"

set -e

if [[ "${@}" == *"--test"* ]]; then
  # without c8 ... - test will work like nothing happened but coverage directory won't be created
  # requires npm install -g c8
  c8 --reporter=lcov --reporter=html --reporter=text node --experimental-config-file=node.config.json ${@}
else
  node --experimental-config-file=node.config.json ${@}
fi
