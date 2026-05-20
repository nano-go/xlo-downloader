#!/bin/bash

cp icon.png ./public/icon/16.png
mogrify -resize 16x16 ./public/icon/16.png

cp icon.png ./public/icon/32.png
mogrify -resize 32x32 ./public/icon/32.png

cp icon.png ./public/icon/48.png
mogrify -resize 48x48 ./public/icon/48.png

cp icon.png ./public/icon/96.png
mogrify -resize 96x96 ./public/icon/96.png

cp icon.png ./public/icon/128.png
mogrify -resize 128x128 ./public/icon/128.png


