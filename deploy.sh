#!/usr/bin/env bash
scp credentials.json root@volha:~/results/credentials.json
ssh volha 'bash -s' < install.sh
