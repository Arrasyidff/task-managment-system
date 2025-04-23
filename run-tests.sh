#!/bin/bash

# Script to run integration tests in Docker

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Running Integration Tests ===${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Build and run tests
echo -e "${YELLOW}Building test container...${NC}"
docker-compose -f docker-compose.test.yml build

echo -e "${YELLOW}Running tests...${NC}"
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Get the exit code of the test container
TEST_EXIT_CODE=$(docker-compose -f docker-compose.test.yml ps -q app-test | xargs docker inspect -f '{{.State.ExitCode}}')

# Clean up
echo -e "${YELLOW}Cleaning up...${NC}"
docker-compose -f docker-compose.test.yml down

# Check test results
if [ "$TEST_EXIT_CODE" = "0" ]; then
  echo -e "${GREEN}Tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Tests failed with exit code $TEST_EXIT_CODE${NC}"
  exit 1
fi