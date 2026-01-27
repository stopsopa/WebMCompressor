time ffmpeg -loglevel error -progress - -i "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 4 -an -pass 1 -f null /dev/null


echo '-----------------------  end of first pass --- start of second pass ---------------------'
time ffmpeg -loglevel error -progress - -i "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 2 -c:a libopus -pass 2 -metadata creation_time="2026-01-27T01:00:51.901Z" -metadata comment="sayonara" -y "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].webm"
