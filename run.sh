#!/bin/bash

# Termux Automation Script for XtreamPlaylist
# This script will update the system, install dependencies, clone the repo, and start the server.

echo "--- Updating packages ---"
pkg update && pkg upgrade -y

echo "--- Installing Node.js and Git ---"
pkg install nodejs git -y

echo "--- Cloning repository ---"
# Check if directory already exists
if [ -d "xtream-playlist" ]; then
    echo "Directory 'xtream-playlist' already exists. Skipping clone."
    cd xtream-playlist
    git pull
else
    git clone https://github.com/CodesRahul96/xtream-playlist.git
    cd xtream-playlist
fi

echo "--- Installing dependencies ---"
npm install

echo "--- Starting IPTX Proxy Server ---"
node server.js
