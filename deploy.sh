#!/bin/bash
# Shortcut to a capistrano deploy

function usage(){
	echo === Builds ===
	ls -l ../builds/ | awk '{print $9}' |  sed 's/.tar.gz//'
	echo 
	echo Usage example: $0 testing aa-b123
	echo 
	exit 1
}

BUILD_FILE="../builds/$2.tar.gz"

if [ ! -f "$BUILD_FILE" ]; then
	usage
fi

if [ -z $1 ]; then
	usage
fi

cap $1 deploy -s build=$2