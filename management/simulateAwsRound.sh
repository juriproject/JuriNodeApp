#!/bin/sh

export $(egrep -v '^#' awsDnsNames.env | xargs)

CONTROLLER_PUBLIC_KEY=$1
CONTROLLER_PRIVATE_KEY=$2
TIME_PER_STAGE=$3
USER_COUNT=$4
NODE_COUNT=$5

CONTROLLER_LOG_FILE=logs/controllerNode.log
NODE_LOG_FILES=()

FIRST_NODE_INDEX=1
 
for (( i=$FIRST_NODE_INDEX; i<=$NODE_COUNT; i++ ))
do
    ((NODE_INDEX=i-1))
	NODE_LOG_FILES+=("logs/node${NODE_INDEX}.log") 
done

rm logs/*

echo 'Updating repos...'
ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "cd JuriNodeApp && git pull"
for ((index=1; index-1<${#NODE_LOG_FILES[@]}; ++index)); do
    HOST="NODE$index"
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" "cd JuriNodeApp && git pull"
done
echo 'Updating repos finished!'

ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "CONTROLLER_PUBLIC_KEY=$CONTROLLER_PUBLIC_KEY CONTROLLER_PRIVATE_KEY=$CONTROLLER_PRIVATE_KEY node JuriNodeApp/controllerNode/setupProxyForNewRound.js"
ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "CONTROLLER_PUBLIC_KEY=$CONTROLLER_PUBLIC_KEY CONTROLLER_PRIVATE_KEY=$CONTROLLER_PRIVATE_KEY TIME_PER_STAGE=$TIME_PER_STAGE node JuriNodeApp/controllerNode/" >> $CONTROLLER_LOG_FILE &

for ((index=1; index-1<${#NODE_LOG_FILES[@]}; ++index)); do
    HOST="NODE$index"
    ((NODE_INDEX=index-1))
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" "NODE_INDEX=$NODE_INDEX TIME_PER_STAGE=$TIME_PER_STAGE USER_COUNT=$USER_COUNT node JuriNodeApp/juriNode/" >> "${NODE_LOG_FILES[index-1]}" &
done

tail -f "${NODE_LOG_FILES[0]}"