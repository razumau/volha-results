sudo apt-get -y install software-properties-common
sudo add-apt-repository ppa:fkrull/deadsnakes
sudo apt-get update
sudo apt-get -y install python3.5 libpq-dev python3.5-dev build-essential
sudo apt-get install git postgresql postgresql-contrib
sudo pip3 install virtualenv
cd /home/results
git fetch
git reset --hard origin/master
virtualenv -p /usr/bin/python3.5 /tmp/results
source /tmp/results/bin/activate
pip3 install -r /home/results/requirements.txt
# find /home/etladmin/data/pipeline/tauspy/scripts -name ""  | xargs chmod +x