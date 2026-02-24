# AI Development Instructions for RBTC Audio Converter

RBTC Audio Converter is a cross-platform tool designed to make high-quality audio conversion accessible to all users, regardless of technical background or operating system. The project provides a user-friendly graphical interface (GUI) for converting audio files—primarily WAV to MP3—using the robust logic originally implemented in a universal shell script. By leveraging Electron, the application aims to deliver a seamless desktop experience for both macOS and Windows users, automating complex tasks like audio conversion, metadata tagging, and cover art embedding, all without requiring command-line interaction.

The core logic—batch conversion, silence removal, metadata enhancement, and cover art support—is preserved from the shell script, ensuring consistent results. The Electron app will package this functionality into a native application for each OS, making advanced audio processing as simple as drag-and-drop.

## Architecture Overview

This is a **Lerna monorepo** for audio file conversion (WAV→MP3) with background job processing. Key packages:

- `packages/api/` - Express.js backend with BullMQ job queues
- `packages/frontend/` - React with Ant Design and Vite
- `packages/electron/` - Electron wrapper app
- `packages/docs/` - Docusaurus documentation

## Important info

For now: Ignore the api and frontend package. I want to do everything via the electron package.

Help me to create the electron app to create a GUI for the audio converter. The app should allow users to select WAV files, configure conversion settings, and start the conversion process. It should also display progress and handle errors gracefully.


