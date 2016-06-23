#!/usr/bin/env bash
sudo apt-get -y install software-properties-common
sudo add-apt-repository ppa:fkrull/deadsnakes
sudo apt-get update
sudo apt-get -y install python3.5 libpq-dev python3.5-dev python3-pip build-essential
sudo apt-get install git postgresql postgresql-contrib libffi-dev
sudo pip3 install virtualenv
cd /root/results
git fetch
git reset --hard origin/master
virtualenv -p /usr/bin/python3.5 /root/results_env
source /root/results_env/bin/activate
pip3 install -r /root/results/requirements.txt
forever stopall
forever start -c /root/results_env/bin/python3.5 run.py
forever list

