#!/bin/bash

# Kill any processes running on ports 5000 and 5001
echo "Checking for processes on ports 5000 and 5001..."

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  PORT_5000_PID=$(lsof -ti:5000)
  PORT_5001_PID=$(lsof -ti:5001)
  
  if [ ! -z "$PORT_5000_PID" ]; then
    echo "Killing process on port 5000 (PID: $PORT_5000_PID)"
    kill -9 $PORT_5000_PID
  fi
  
  if [ ! -z "$PORT_5001_PID" ]; then
    echo "Killing process on port 5001 (PID: $PORT_5001_PID)"
    kill -9 $PORT_5001_PID
  fi
# For Linux
else
  PORT_5000_PID=$(netstat -tulpn 2>/dev/null | grep ':5000' | awk '{print $7}' | cut -d'/' -f1)
  PORT_5001_PID=$(netstat -tulpn 2>/dev/null | grep ':5001' | awk '{print $7}' | cut -d'/' -f1)
  
  if [ ! -z "$PORT_5000_PID" ]; then
    echo "Killing process on port 5000 (PID: $PORT_5000_PID)"
    kill -9 $PORT_5000_PID
  fi
  
  if [ ! -z "$PORT_5001_PID" ]; then
    echo "Killing process on port 5001 (PID: $PORT_5001_PID)"
    kill -9 $PORT_5001_PID
  fi
fi

# Start the server
echo "Starting server..."
node index.js 