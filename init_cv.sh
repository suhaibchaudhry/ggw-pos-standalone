#!/usr/bin/env bash
res=$(xrandr -q | awk -F'current' -F',' 'NR==1 {gsub("( |current)","");print $2}')
resx=$(echo $res | awk '{split($0,array,"x")} END{print array[1]}')
resy=$(echo $res | awk '{split($0,array,"x")} END{print array[2]}')

echo "{
  \"name\": \"Customer View\",
  \"version\": \"1\",
  \"description\": \"General Goods Wholesale Customer View.\",
  \"main\": \"main.html\",
  \"window\": {
    \"width\": $resx,
    \"height\": $resy,
    \"title\": \"GGW Customer View\",
    \"toolbar\": false,
    \"kiosk\": true
  }
}" > $HOME/ggw-pos-standalone/customerview/package.json
