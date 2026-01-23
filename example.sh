
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate
# bitrates from: https://developers.google.com/media/vp9/settings/vod/#bitrate

echo "don't run this script"
exit 1;

set -e

#set -x

if [ "$1" = "" ]; then

cat << EOF

/bin/bash "$0" --determine-name IMG_087543.MOV
  # to just get name which will be used after converting

/bin/bash "$0" IMG_087543.MOV
  # convert to mp4 h265 and place in target directory

EOF

    exit 1
fi

TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE="0";
DETERMINENAME="0";
EXTENSION="mp4";
VP92PASS="0";

PARAMS=""
while (( "$#" )); do
  case "$1" in
    --try-to-ignore-errors-and-lets-see-if-it-will-generate-working-file)
      TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE="1";
      shift;
      ;;
    --determine-name)
      DETERMINENAME="1";
      shift;
      ;;
    --vp92pass)
      VP92PASS="1";
      shift;
      ;;
    --extension)
      EXTENSION="$2";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "$#" )); do          # optional
        if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
        else
          if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
          else
            PARAMS="$PARAMS \"$1\""
          fi
        fi
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash $0 -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      echo "$0 Error: Unsupported flag $1" >&2
      exit 11;
      ;;
    *) # preserve positional arguments
      if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
      else
        if [ "$PARAMS" = "" ]; then
            PARAMS="\"$1\""
        else
          PARAMS="$PARAMS \"$1\""
        fi
      fi
      shift;
      ;;
  esac
done

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

source "$_DIR/../bash/trim.sh"

PARAMS="$(trim "$PARAMS")"

# set positional arguments in their proper place
eval set -- "$PARAMS"

_ROOT="$_DIR/../";

if [ "$1" = "" ]; then

  echo -n "video file source should be specified as a first argument"

  exit 12
fi

if [ ! -f "$1" ]; then

  echo -n "specified path ($1) is not pointing to a file"

  exit 13
fi

set +e
CREATION_TIME="$(/bin/bash "$_DIR/get-create-time-metatag-ffprobe.sh" "$1" 2>&1)"

if [ "$?" != "0" ]; then

  echo -n "$CREATION_TIME"

  exit 14;
fi

PARTS="$(node "$_DIR/lib/split-time.js" "$CREATION_TIME")"

if [ "$?" != "0" ]; then

  echo -n "$PARTS"

  exit 15;
fi
set -e

IFS=' ' read -ra a <<<"$PARTS";
PARTS_ARRAY=("${a[@]}")

#>>2020<<
#>>12<<
#>>01<<
#>>16<< echo "${PARTS_ARRAY[3]}"
#>>51<<
#>>10<<

SUM="$(sha1sum "$1" | awk '{print $1}')"

DIR="${PARTS_ARRAY[0]}/${PARTS_ARRAY[1]}"

FILE="${PARTS_ARRAY[2]}-${PARTS_ARRAY[3]}-${PARTS_ARRAY[4]}-${PARTS_ARRAY[5]}-$SUM.$EXTENSION"

if [ "$DETERMINENAME" = "0" ]; then

  source "$_DIR/../env.sh"

  echo "compressing $1 -> $GPHOTOSTARGET_/$DIR/$FILE"
  echo "LINK ░▒▓ ${ENV_VAR_CLI_LINK_INSPECTOR:-ENV_VAR_CLI_LINK_INSPECTOR}${DIR}/${FILE}"

  mkdir -p "$GPHOTOSTARGET_/$DIR";

  if [ -f "$GPHOTOSTARGET_/$DIR/$FILE" ]; then

    echo "    file $DIR/$FILE already exist"

    echo "$DIR/$FILE"
  else

    TARGET="$1"

    shift;

    if [ "$VP92PASS" = "1" ]; then

#       cat <<EOF

# ffmpeg -loglevel error -i "$TARGET" -vf scale=iw*0.7:ih*0.7 -c:v libvpx-vp9 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -g 240 -threads 8 -quality good -speed 4 -crf 32 -pass 1 -an -f null /dev/null
# ffmpeg -loglevel error -i "$TARGET" -vf scale=iw*0.7:ih*0.7 -c:v libvpx-vp9 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -g 240 -threads 8 -quality good -speed 2 -crf 32 -pass 2 -c:a libopus -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" "$GPHOTOSTARGET_/$DIR/$FILE"

# EOF

      cat <<EOF

ffmpeg -loglevel error -i "$TARGET" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 4 -g 240 -threads 4 -quality good -speed 4 -crf 32 -pass 1 -an -f null /dev/null
ffmpeg -loglevel error -i "$TARGET" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 4 -g 240 -threads 4 -quality good -speed 2 -crf 32 -pass 2 -c:a libopus -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" -y "$GPHOTOSTARGET_/$DIR/$FILE"

EOF
    else

      source "$_DIR/../bash/args.sh"

      cat <<EOF

ffmpeg -loglevel error -i "$TARGET" -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" -vf scale=iw*0.7:ih*0.7 $___PARAMS -y "$GPHOTOSTARGET_/$DIR/$FILE"

EOF
    fi

    function cleanup {

#      echo 'cleanup...'

      rm -rf "$GPHOTOSTARGET_/$DIR/$FILE" || true
    }

    trap cleanup EXIT

    TIME="$(date +"%s")"

    if [ "$TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE" = "1" ]; then
      # if parameter specified then handle errors manually, don't stop automatically on exit error
      set +e
    fi

    if [ "$VP92PASS" = "1" ]; then

      # #https://developers.google.com/media/vp9/settings/vod/#1280x720_24_25_or_30_frames_per_second

      # https://stackoverflow.com/a/18086548
      unset t_std t_err t_ret
      # eval "$( ffmpeg -loglevel error -i "$TARGET" -vf scale=iw*0.7:ih*0.7 -c:v libvpx-vp9 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -g 240 -threads 8 -quality good -speed 4 -crf 32 -pass 1 -an -f null /dev/null \
      eval "$( ffmpeg -loglevel error -i "$TARGET" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 4 -g 240 -threads 4 -quality good -speed 4 -crf 32 -pass 1 -an -f null /dev/null \
        2> >(t_err=$(cat); typeset -p t_err) \
         > >(t_std=$(cat); typeset -p t_std); t_ret=$?; typeset -p t_ret )"

      if [ "$t_err" != "" ]; then

        echo -n "first pass error: $t_err"

        if [ "$TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE" = "0" ]; then

          # if parameter not given then we know that set -e is on so exit code will stop this script
          # but if it will not stop on exit code let's try to detect errors manually and increase error sensitivity

          if [ "$t_ret" = "0" ]; then

            exit 16;
          fi

          exit $t_ret
        fi
      fi

      # https://stackoverflow.com/a/18086548
      unset t_std t_err t_ret
      # eval "$( ffmpeg -loglevel error -i "$TARGET" -vf scale=iw*0.7:ih*0.7 -c:v libvpx-vp9 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -g 240 -threads 8 -quality good -speed 2 -crf 32 -pass 2 -c:a libopus -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" "$GPHOTOSTARGET_/$DIR/$FILE" \
      eval "$( ffmpeg -loglevel error -i "$TARGET" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 4 -g 240 -threads 4 -quality good -speed 2 -crf 32 -pass 2 -c:a libopus -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" -y "$GPHOTOSTARGET_/$DIR/$FILE" \
        2> >(t_err=$(cat); typeset -p t_err) \
         > >(t_std=$(cat); typeset -p t_std); t_ret=$?; typeset -p t_ret )"

      if [ "$t_err" != "" ]; then

        echo -n "second pass error: $t_err"

        if [ "$TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE" = "0" ]; then

          # if parameter not given then we know that set -e is on so exit code will stop this script
          # but if it will not stop on exit code let's try to detect errors manually and increase error sensitivity

          if [ "$t_ret" = "0" ]; then

            exit 17;
          fi

          exit $t_ret
        fi
      fi
    else

      source "$_DIR/../bash/args.sh"

      # https://stackoverflow.com/a/18086548
      unset t_std t_err t_ret
      # eval "$( ffmpeg -loglevel error -i "$TARGET" -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" -vf scale=iw*0.7:ih*0.7 $___PARAMS "$GPHOTOSTARGET_/$DIR/$FILE" \
      eval "$( ffmpeg -loglevel error -i "$TARGET" -metadata creation_time="$CREATION_TIME" -metadata comment="sayonara" $___PARAMS -y "$GPHOTOSTARGET_/$DIR/$FILE" \
        2> >(t_err=$(cat); typeset -p t_err) \
         > >(t_std=$(cat); typeset -p t_std); t_ret=$?; typeset -p t_ret )"

      if [ "$t_err" != "" ]; then

        echo -n "single pass error: $t_err"

        if [ "$TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE" = "0" ]; then

          # if parameter not given then we know that set -e is on so exit code will stop this script
          # but if it will not stop on exit code let's try to detect errors manually and increase error sensitivity

          if [ "$t_ret" = "0" ]; then

            exit 18;
          fi

          exit $t_ret
        fi
      fi
    fi

    if [ "$TRY_TO_IGNORE_ERRORS_AND_LETS_SEE_IF_IT_WILL_GENERATE_WORKING_FILE" = "1" ]; then
      set -e
    fi

    echo ""

    UNIT="sec"
    TIME="$(bc <<< "scale=2; ($(date +"%s")-$TIME)")"

    if [ "$TIME" -gt "60" ]; then
      UNIT="min"
      TIME="$(bc <<< "scale=2; ($TIME/60)")"
    fi

    echo "processed in $TIME$UNIT"
    echo "LINK ░▒▓ ${ENV_VAR_CLI_LINK_INSPECTOR:-ENV_VAR_CLI_LINK_INSPECTOR}${DIR}/${FILE}"

    ls -lah "$TARGET"
    ls -lah "$GPHOTOSTARGET_/$DIR/$FILE"

    echo -n "$DIR/$FILE"

    trap - EXIT
  fi

  exit 0;
fi

echo -n "$DIR/$FILE"

