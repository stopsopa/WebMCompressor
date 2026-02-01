DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$(cd "${DIR}/../../.." && pwd)"

# WARNING:
# this is just a demo of general logic how it could be potentially used in the future
# but in the final app we cannot relay on bash and also we have to ask user if he would like to keep original video size or scale
# if scale then we have to get width or height and calculate proprotionally mainaining original width/heigh ratio
# and inject this information to cli.ts library for further calculations to determine target bitrate
# WARNING:

# /bin/bash ${DIR}/cli.sh [file.mov]
FILE="${1}"

if [ ! -f "${FILE}" ]; then
    echo "${0} error: File not found FILE=>${FILE}<"
    exit 1
fi

METADATA_SCRIPT="${DIR}/extractMetadata.sh"
LINES_ARRAY=($(/bin/bash "${METADATA_SCRIPT}" "${FILE}"))

# declare -p LINES_ARRAY
# declare -a LINES_ARRAY='([0]="1920" [1]="1080" [2]="60" [3]="10050")'

TMP=$(mktemp)

TS_SH="${ROOT}/ts.sh"
CLI_TS="${DIR}/cli.ts"

NODE_OPTIONS="" /bin/bash "${TS_SH}" "${CLI_TS}" -s "${FILE}" -h "${LINES_ARRAY[1]}" -w "${LINES_ARRAY[0]}" -r "${LINES_ARRAY[2]}" -du "${LINES_ARRAY[3]}" -e ffmpeg > "${TMP}"

if [ "${?}" != "0" ]; then
    
    cat <<EEE
${0} error: cli.ts failed for FILE=>${FILE}<, see more details:
  cat "${TMP}"

EEE

    exit 1;
fi

cat "${TMP}"


if [ -t 0 ]; then
    # this is for
    # /bin/bash inter.sh
    echo -e "\n\n      Press enter to continue\n"
    read
fi


/bin/bash "${TMP}"
