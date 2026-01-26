
# /bin/bash electron/tools/cli.sh [file.mov]
FILE="${1}"

if [ ! -f "${FILE}" ]; then
    echo "${0} error: File not found: ${FILE}"
    exit 1
fi

LINES_ARRAY=($(/bin/bash electron/tools/extractWHandFrameRate.sh "${FILE}"))

# declare -p LINES_ARRAY
# declare -a LINES_ARRAY='([0]="1920" [1]="1080" [2]="60")'

TMP=$(mktemp)

NODE_OPTIONS="" /bin/bash ts.sh electron/tools/cli.ts -s "${FILE}" -h ${LINES_ARRAY[1]} -w ${LINES_ARRAY[0]} -r ${LINES_ARRAY[2]} -e ffmpeg > "${TMP}"

if [ "${?}" != "0" ]; then
    
    cat <<EEE
${0} error: cli.ts failed, see more details:
  cat "${TMP}"

EEE

    exit 1;
fi

cat "${TMP}"


echo -e "\n      Press enter to continue\n"
read

/bin/bash "${TMP}"