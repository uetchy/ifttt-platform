#!/bin/bash

ROOT_DIR=$(dirname $0)

cat $ROOT_DIR/ifso.service | sed "s|{{ROOT_DIR}}|$ROOT_DIR|g" >/etc/systemd/system/ifso.service
