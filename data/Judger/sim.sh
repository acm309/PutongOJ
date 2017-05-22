#!/bin/bash
EXTENSION="$3"
DIR="$2"
FILE="$1"

for i in $(ls -v $DIR/*.$EXTENSION)
do
#	./sim_text -p -e -s $FILE $i | grep ^"$FILE" | awk '{print $4}'
	sim=`./sim_text -p -e -s $FILE $i | grep ^"$FILE" | awk '{print $4}'`
	if [ ! -z $sim ] && [ $sim -gt 50 ]
	then
		sim_s_id=`basename $i | cut -d'.' -f1`
		echo "$sim $sim_s_id" > simfile
		exit 0;
	fi
done
exit 0;
