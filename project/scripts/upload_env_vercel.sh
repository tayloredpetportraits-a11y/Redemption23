#!/bin/bash
# Uploads env vars from .env.local to Vercel

ENV_FILE="project/.env.local"
TEMP_VAL="project/temp_val.txt"

# Ensure we are in root of workspace
# relative to where we run this script from, assuming we run from ~/Redemption23-1/project or ~/Redemption23-1
# We will execute this using `bash project/scripts/upload_env_vercel.sh` from ~/Redemption23-1

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    if [ -z "$key" ]; then continue; fi

    echo "Processing $key..."
    echo -n "$value" > "$TEMP_VAL"
    
    # Add to environments (ignoring errors if they exist)
    npx vercel env add "$key" production < "$TEMP_VAL" 
    npx vercel env add "$key" preview < "$TEMP_VAL" 
    npx vercel env add "$key" development < "$TEMP_VAL" 
    
done < "$ENV_FILE"

rm "$TEMP_VAL"
echo "Upload complete."
