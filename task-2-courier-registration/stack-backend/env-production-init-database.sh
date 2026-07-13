#!/bin/sh
psql    -U root     -p 5432     -c "CREATE DATABASE courier"
psql    -U root     -p 5432     -d courier    <   ../database/courier-env-local-2026-07-10-19h30.tar.gz
