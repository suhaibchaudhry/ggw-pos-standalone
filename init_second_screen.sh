#!/usr/bin/env bash
SCREEN_COUNT=$($HOME/ggw-pos-standalone/utils/x11_count_displays)

if [ "$SCREEN_COUNT" == "2"]; then
	exec xsetroot -display :0.1 -cursor_name left_ptr -bg black
	exec $HOME/ggw-pos-standalone/init_cv.sh
	exec nodewebkit $HOME/ggw-pos-standalone/customerview
fi