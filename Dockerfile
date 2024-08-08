# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg, Python, and virtualenv
RUN apt-get update && \
  apt-get install -y ffmpeg python3 python3-pip python3-venv && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment, then install eyeD3
RUN python3 -m venv /opt/venv && \
  /opt/venv/bin/pip install eyeD3

# Ensure the virtual environment is accessible
ENV PATH="/opt/venv/bin:$PATH"

# Copy the rest of the application code
COPY . .

# Install Node.js dependencies
RUN npm install

# Bootstrap the app (if needed)
RUN npm run bootstrap

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Run the app
CMD ["node", "packages/server/index.js"]
