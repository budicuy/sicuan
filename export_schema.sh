#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set in your environment or .env file."
  exit 1
fi

# Define output file name
OUTPUT_FILE="schema_dump.sql"

echo "Exporting database schema from Neon..."

# Run pg_dump with --schema-only flag (-s) to export only the structure without data
pg_dump "$DATABASE_URL" --schema-only -f "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "Success! Database schema exported successfully to: $OUTPUT_FILE"
else
  echo "Error: Failed to export database schema. Make sure pg_dump is installed and DATABASE_URL is correct."
  exit 1
fi
