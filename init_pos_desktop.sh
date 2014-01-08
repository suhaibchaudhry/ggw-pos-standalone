#!/usr/bin/env bash
#res=$(xrandr -q | awk -F'current' -F',' 'NR==1 {gsub("( |current)","");print $2}')
#resx=$(echo $res | awk '{split($0,array,"x")} END{print array[1]}')
#resy=$(echo $res | awk '{split($0,array,"x")} END{print array[2]}')

echo "{
  \"name\": \"Point of Sale\",
  \"version\": \"1\",
  \"description\": \"General Goods Wholesale Point of Sale.\",
  \"main\": \"main.html\",
  \"window\": {
    \"width\": 1000,
    \"height\": 600,
    \"title\": \"GGW POS\",
    \"toolbar\": true,
    \"kiosk\": false
  }
}" > $HOME/ggw-pos-standalone/pointofsale/package.json
