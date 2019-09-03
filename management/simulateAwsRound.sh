#!/bin/sh

export $(egrep -v '^#' awsDnsNames.env | xargs)

CONTROLLER_PUBLIC_KEY=$1
CONTROLLER_PRIVATE_KEY=$2
TIME_PER_STAGE=$3
USER_COUNT=$4
NODE_COUNT=$5

CONTROLLER_LOG_FILE=logs/controllerNode.log
rm $CONTROLLER_LOG_FILE

NODE_LOG_FILES=()
for i in {1..20}
do
    NODE_LOG_FILES+=("logs/node${i}.log")
    rm "logs/node${i}.log"
done

CONTROLLER_PUBLIC_KEY=$CONTROLLER_PUBLIC_KEY CONTROLLER_PRIVATE_KEY=$CONTROLLER_PRIVATE_KEY node controllerNode/setupProxyForNewRound.js
CONTROLLER_PUBLIC_KEY=$CONTROLLER_PUBLIC_KEY CONTROLLER_PRIVATE_KEY=$CONTROLLER_PRIVATE_KEY TIME_PER_STAGE=$TIME_PER_STAGE node controllerNode >> $CONTROLLER_LOG_FILE &

ssh -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}"

for ((index=0; index<${#NODE_LOG_FILES[@]}; ++index)); do
    ssh -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}"
    NODE_INDEX=$index TIME_PER_STAGE=$TIME_PER_STAGE USER_COUNT=$USER_COUNT node juriNode/ >> "${NODE_LOG_FILES[index]}" &
done

tail -f "${NODE_LOG_FILES[0]}"