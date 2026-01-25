
# add --watch flag for dev mode

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "${DIR}/.env.sh"

set -e

node ${@}
