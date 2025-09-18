# Use an official Node.js runtime as a parent image
FROM node:21

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg and eyeD3
RUN apt-get update && \
  apt-get install -y ffmpeg eyed3 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY ./packages/api/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY ./packages/api .

# Copy frontend build
COPY ./packages/frontend/dist ./dist

# Expose the port the app runs on
EXPOSE 8000

# Run the app
CMD ["node", "index.js"]
