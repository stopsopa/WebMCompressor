
# /bin/bash electron/tools/extractWHandFrameRate.sh [file.mov]

FILE="${1}"

if [ ! -f "${FILE}" ]; then
    echo "${0} error: File not found: ${FILE}"
    exit 1
fi

# trim and check if there are exactly 3 lines in the output
LINES_ARRAY=($(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${FILE}"))


if [ ${#LINES_ARRAY[@]} -ne 3 ]; then
    echo "${0} error: Invalid output from ffprobe (expected 3 values, got ${#LINES_ARRAY[@]})"
    exit 1
fi

WIDTH="${LINES_ARRAY[0]}"
HEIGHT="${LINES_ARRAY[1]}"
FPS="${LINES_ARRAY[2]}"

# normalize FPS: take only leading digits from the beginning (e.g. 60/1 -> 60)
if [[ "${FPS}" =~ ^([0-9]+) ]]; then
    FPS="${BASH_REMATCH[1]}"
fi


# check if width matches regex ^[0-9]+$
if ! [[ "${WIDTH}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid width from ffprobe: ${WIDTH}"
    exit 1
fi

# check if height matches regex ^[0-9]+$
if ! [[ "${HEIGHT}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid height from ffprobe: ${HEIGHT}"
    exit 1
fi

# check if fps matches regex ^[0-9]+$
if ! [[ "${FPS}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid fps from ffprobe: ${FPS}"
    exit 1
fi

echo "${WIDTH}"
echo "${HEIGHT}"
echo -n "${FPS}"