#!/bin/sh
psql    -U root     -p 5432     -c "CREATE DATABASE merchant"
psql    -U root     -p 5432     -d merchant    <   ../database/merchant-env-local-2026-07-13-21h00.tar.gz
