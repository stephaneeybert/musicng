#!/bin/sh -x

filename=ng-zero

zipfile=$filename.zip

currentDir=`pwd`

cd ..

zip -r $zipfile $filename -x "*.editorconfig" "*.project" "*.settings/*" "*node_modules/*"

mv -f $zipfile /home/stephane/backup

cd $currentDir
