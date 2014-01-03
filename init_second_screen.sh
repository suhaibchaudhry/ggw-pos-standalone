#!/usr/bin/env bash
SCREEN_COUNT=$($HOME/ggw-pos-standalone/utils/x11_count_displays)

if [ "$SCREEN_COUNT" == "2" ]; then
	xsetroot -display :0.1 -cursor_name left_ptr -bg black
	$HOME/ggw-pos-standalone/init_cv.sh
	nodewebkit $HOME/ggw-pos-standalone/customerview
fi