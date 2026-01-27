time ffmpeg -loglevel error -i "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 4 -an -pass 1 -f null /dev/null
echo '-----------------------  end of first pass --- start of second pass ---------------------'

time ffmpeg -loglevel error -progress - -i "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 1800k -minrate 900k -maxrate 2610k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 2 -c:a libopus -pass 2 -metadata creation_time="2026-01-27T02:41:40.278Z" -metadata comment="sayonara" -y "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].webm"
