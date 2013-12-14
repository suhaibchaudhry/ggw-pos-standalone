#!/usr/bin/env bash
res=$(xrandr -q | awk -F'current' -F',' 'NR==1 {gsub("( |current)","");print $2}')
resx=$(echo $res | awk '{split($0,array,"x")} END{print array[1]}')
resy=$(echo $res | awk '{split($0,array,"x")} END{print array[2]}')

echo "{
  \"name\": \"Point of sale\",
  \"version\": \"1\",
  \"description\": \"General Goods Wholesale Point of Sale.\",
  \"main\": \"main.html\",
  \"window\": {
    \"width\": $resx,
    \"height\": $resy,
    \"title\": \"Mini Code Editor\",
    \"toolbar\": false,
    \"kiosk\": true
  }
}" > /home/digerpaji/pos/pointofsale/package.json

nodewebkit /home/digerpaji/pos/pointofsale