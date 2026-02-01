DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# This is original script - prototype - written in bash
# at lates stages of implementing final UI wrapper I've decided to rewrite it in TypeScript (extractMetadata.ts)
# to don't relay on presence of bash on target machine
# -----------------------------------------------------------------------------------------

# /bin/bash ${DIR}/extractMetadata.sh [file.mov]
# This script extracts the width, height, and frame rate (FPS) from a video file using ffprobe.
# It normalizes the FPS to its numerator (leading digits) and outputs four values on separate lines:
# 1. Width
# 2. Height
# 3. Normalized FPS
# 4. Duration in milliseconds (no trailing newline)
# Example output for 1920x1080 60fps 10s video:
# 1920
# 1080
# 60
# 10050

FILE="${1}"

if [ ! -f "${FILE}" ]; then
    echo "${0} error: File not found FILE=>${FILE}<"
    exit 1
fi

# trim and check if there are exactly 4 lines in the output
LINES_ARRAY=($(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${FILE}"))


if [ "${#LINES_ARRAY[@]}" -ne 4 ]; then
    echo "${0} error: Invalid output from ffprobe (expected 4 values, got ${#LINES_ARRAY[@]}) for FILE=>${FILE}<"
    exit 1
fi

WIDTH="${LINES_ARRAY[0]}"
HEIGHT="${LINES_ARRAY[1]}"
FPS="${LINES_ARRAY[2]}"
DURATION="${LINES_ARRAY[3]}"

# normalize FPS: take only leading digits from the beginning (e.g. 60/1 -> 60)
if [[ "${FPS}" =~ ^([0-9]+) ]]; then
    FPS="${BASH_REMATCH[1]}"
fi


# check if width matches regex ^[0-9]+$
if ! [[ "${WIDTH}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid width from ffprobe WIDTH=>${WIDTH}< for FILE=>${FILE}<"
    exit 1
fi

# check if height matches regex ^[0-9]+$
if ! [[ "${HEIGHT}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid height from ffprobe HEIGHT=>${HEIGHT}< for FILE=>${FILE}<"
    exit 1
fi

# check if fps matches regex ^[0-9]+$
if ! [[ "${FPS}" =~ ^[0-9]+$ ]]; then
    echo "${0} error: Invalid fps from ffprobe FPS=>${FPS}< for FILE=>${FILE}<"
    exit 1
fi

# check if duration matches regex ^[0-9]+(\.[0-9]+)?$
if ! [[ "${DURATION}" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    echo "${0} error: Invalid duration from ffprobe DURATION=>${DURATION}< for FILE=>${FILE}<"
    exit 1
fi

# transform seconds to miliseconds in raw bash
DURATION=$(awk "BEGIN { print int(${DURATION} * 1000) }")

echo "${WIDTH}"
echo "${HEIGHT}"
echo "${FPS}"
echo -n "${DURATION}"