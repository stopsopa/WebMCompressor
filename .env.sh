
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "${DIR}/.env" ]; then
    # https://unix.stackexchange.com/a/79065
    eval "$(/bin/bash "${DIR}/bash/exportsource.sh" "${DIR}/.env")"
fi

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

# check also if PROJECT_NAME exist
if [ -z "${PROJECT_NAME}" ]; then
    echo "${0} error: PROJECT_NAME is not set"
    exit 1
fi

# export NODE_OPTIONS="${NODE_OPTIONS} --experimental-strip-types --experimental-transform-types --import file://${DIR}/node-suppress-warning.js"
# above is valid but now flags are added using --experimental-config-file=node.config.json in ts.sh
