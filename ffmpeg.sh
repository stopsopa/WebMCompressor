ffmpeg -loglevel error -i "/Users/szdz/Workspace/STOPSOPA__WebMCompressor/STOPSOPA__WebMCompressor/example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club.mov" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 4 -an -pass 1 -f null /dev/null


ffmpeg -loglevel error -i "/Users/szdz/Workspace/STOPSOPA__WebMCompressor/STOPSOPA__WebMCompressor/example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club.mov" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 2 -c:a libopus -pass 2 -metadata creation_time="2026-01-26T23:18:45.402Z" -metadata comment="sayonara" -y "/Users/szdz/Workspace/STOPSOPA__WebMCompressor/STOPSOPA__WebMCompressor/example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club.webm"



@ffmpeg.sh 

