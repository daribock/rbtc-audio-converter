# Use an official Node.js runtime as a parent image
FROM node:21

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg and eyeD3
RUN apt-get update && \
  apt-get install -y ffmpeg eyed3
# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY ./server .

# Expose the port the app runs on
EXPOSE 5000

# Run the app
CMD ["node", "index.js"]
