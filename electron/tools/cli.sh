
TMP=$(mktemp)

echo "echo dupa" > ${TMP}

cat <<EEE

TMP >${TMP}<

EEE

/bin/bash ${TMP}

exit 1

NODE_OPTIONS="" /bin/bash ts.sh electron/tools/cli.ts -s "input.mp4" -h 1080 -w 1920 -r 30 -e ffmpeg > "${TMP}"