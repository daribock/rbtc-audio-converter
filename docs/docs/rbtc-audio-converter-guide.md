---
slug: /
---

# RBTC Audio Converter Guide

## What it does

The RBTC Audio Converter turns WAV files into MP3 files and adds the RBTC metadata automatically. You can select up to 15 files at once, choose the lesson number for each file, and convert them in one batch, with up to 2 files being processed in parallel.

## Download the app

1. Open the GitHub repository.
2. Go to **[Releases](https://github.com/daribock/rbtc-audio-converter/releases/latest)** on the right side of the repository page.
3. Open the latest release.
4. Scroll to **Assets**.
5. Download the file that matches your operating system.

If you do not see the assets list, the release has not been published yet.

## Important note

The app is not code-signed yet. That means your computer may show a security warning the first time you open it.

### Installation on macOs

To run the app, please follow these steps:

1. Download the app and drag it to your **Applications** folder.
2. Open your **Terminal** (press `Cmd + Space`, type "Terminal", and hit Enter).
3. Paste the following command and hit Enter:

```bash
xattr -cr /Applications/RBTC\ Audio\ Converter.app
```

### Installation on Windows

On Windows, you may need to choose **More info** and then **Run anyway**.

## How to use it

1. Open the app.
2. Select your WAV files.
3. Set the lesson number for each file.
4. Enter the shared metadata once: teacher, city, and subject.
5. Click **Convert files**.
6. Wait for the progress screen to finish.

## Output

The app saves the converted MP3 files to your Downloads folder.

Each file name uses the lesson number and the shared metadata, so the files stay organized.

## Notes

- Only WAV files are supported.
- You can upload up to 15 files at a time.
- Lesson numbers must be unique.
- If two output files would have the same name, the app adds a suffix so nothing gets overwritten.
