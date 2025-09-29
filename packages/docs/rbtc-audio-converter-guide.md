# RBTC Audio Converter - Step-by-Step Guide

## 📖 Overview

The RBTC Audio Converter is a universal script that converts WAV audio files to MP3 format with proper metadata for RBTC classes. It works on Windows (with WSL), macOS, and Linux.

## 🎯 What the Script Does

- Converts WAV files to MP3 (192k bitrate)
- Adds proper metadata (artist, album, track number, year)
- Automatically removes silence from the end of recordings
- Adds cover art (logo) to MP3 files
- Creates organized output with proper naming convention
- Provides detailed statistics and timing information

## Setup

### 🖥️ Windows Setup (WSL) - Recommended Method

### Step 1: Install WSL (Windows Subsystem for Linux)

1. **Open PowerShell as Administrator**
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Install WSL**

   ```powershell
   wsl --install
   ```

3. **Restart your computer** when prompted

4. **Set up Ubuntu**
   - After restart, open Ubuntu
   - Create a username and password when prompted
   - Remember these credentials!

### Step 2: Update WSL and Install Dependencies

1. **Open WSL Terminal**
   - Press `Windows + R`, type `wsl`, press Enter
   - Or search for "Ubuntu" in Start menu

2. **Update the system**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install required packages** (the script can do this automatically, but you can pre-install):
   ```bash
   sudo apt install -y ffmpeg eyed3
   ```

### Step 3: Get the Script

1. **Download the script file**
   - Copy the `rbtc-audio-converter.sh` file to your Windows Downloads folder

2. **Make the script executable**
   ```bash
   chmod +x rbtc-audio-converter.sh
   ```

### Step 4: Prepare Your Files

1. **Create a folder structure** (example):

   ```
   C:\Users\YourName\Music\rbtc-audio\
   ├── 2025-09-29-lesson\
   │   ├── roh\
   │   │   ├── 2025_0929_1400.WAV
   │   │   ├── 2025_0929_1401.WAV
   │   │   └── rbtc-audio-converter.sh
   └── logo.jpg
   ```

2. **Access Windows files from WSL**
   - Windows C: drive is available at `/mnt/c/`
   - Navigate to your folder:
   ```bash
   cd /mnt/c/Users/YourName/Music/RBTC/2025-09-29-lesson/
   ```

### 🍎 MacOS Setup

### Step 1: Install Homebrew (if not already installed)

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Install Homebrew**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

### Step 2: Install Dependencies

The script will automatically install these via Homebrew, or you can pre-install:

```bash
brew install ffmpeg eyed3
```

### Step 3: Get the Script

1. **Download and place the script** in your audio files folder
2. **Make it executable**
   ```bash
   chmod +x rbtc-audio-converter.sh
   ```

### 🐧 Linux Setup

### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y ffmpeg eyed3
```

### RHEL/CentOS/Fedora:

```bash
sudo yum install -y ffmpeg eyed3
```

### Arch Linux:

```bash
sudo pacman -S ffmpeg eyed3
```

## 🚀 How to Use the Script

### Step 1: Prepare Your Files

1. **Create a folder** for your recording session
2. **Place your WAV files** in this folder
3. **Copy the script** (`rbtc-audio-converter.sh`) into the same folder
4. **Add logo file** (`logo.jpg`) in the folder or parent directory

**Example folder structure:**

```
C:\Users\YourName\Music\rbtc-audio\
├── 2025-09-29-lesson\
│   ├── roh\
│   │   ├── 2025_0929_1400.WAV
│   │   ├── 2025_0929_1401.WAV
│   │   └── rbtc-audio-converter.sh
└── logo.jpg
```

### Step 2: Run the Script

1. **Open terminal** and navigate to your folder:

   **Windows (WSL):**

   ```bash
   cd /mnt/c/Users/YourName/path/to/lesson-folder/
   ```

   **macOS/Linux:**

   ```bash
   cd /path/to/lesson-folder/
   ```

2. **Run the script:**
   ```bash
   bash rbtc-audio-converter.sh
   ```

### Step 3: Follow the Prompts

The script will ask you for:

1. **Subject (Fachkürzel):** Enter the subject code
2. **City:** Enter the city name (e.g., MN for München)
3. **Teacher (Lehrerkürzel):** Enter teacher initials (e.g., "MW" for "Monika Wagner")

### Step 4: Logo Handling

The script will automatically search for logo files in these locations:

- Current directory (`./logo.jpg`, `./logo.png`)
- Parent directory (`../logo.jpg`)
- Assets folders (`./assets/`, `../assets/`)
- Common user folders (Documents, Downloads, Desktop)

If no logo is found, you can:

- Specify a custom path
- Continue without cover art

### Step 5: Conversion Process

The script will:

1. Convert each WAV file to MP3
2. Add metadata (artist, title, album, track number)
3. Add cover art (if logo found)
4. Save files to `../bearbeitet/` folder

**Output filename format:** `YYMMDD SUBJECT 01 CITY TEACHER.mp3`
**Example:** `250929 MA 01 Berlin SM.mp3`

### Step 6: Review Results

After completion, you'll see:

```
CONVERSION COMPLETE!
==========================================
PROCESSING STATISTICS:
  • Total files found: 3
  • Successfully converted: 3
  • Processing time: 1m 23s
  • Output directory: ../bearbeitet

SUCCESSFULLY CONVERTED FILES:
  • 250929 MA 01 Berlin SM.mp3
  • 250929 MA 02 Berlin SM.mp3
  • 250929 MA 03 Berlin SM.mp3
==========================================
```

## 📁 File Organization

**Before conversion:**
```
2025-09-29-lesson/
├── roh/
│   ├── 2025_0929_1400.WAV
│   ├── 2025_0929_1401.WAV
│   └── rbtc-audio-converter.sh
└── logo.jpg
```

**After conversion:**
```
2025-09-29-lesson/
├── roh/
│   ├── 2025_0929_1400.WAV (original files remain)
│   ├── 2025_0929_1401.WAV
│   └── rbtc-audio-converter.sh
├── bearbeitet/
│   ├── 250929 MA 01 Berlin SM.mp3
│   ├── 250929 MA 02 Berlin SM.mp3
│   └── 250929 MA 03 Berlin SM.mp3
└── logo.jpg
```

## 💡 Tips and Best Practices

1. **File Naming:** The script works best with files named like `YYYY_MMDD_HHMM.WAV`
2. **Logo Placement:** Put your logo file in the same folder or name it `logo.jpg`
3. **Batch Processing:** You can process multiple sessions by running the script in different folders
4. **Backup:** Original WAV files are never deleted, only converted
5. **WSL Performance:** For better performance, copy files to WSL filesystem (`~/`) instead of accessing Windows files directly

_Need help? Write me an email under darikletter@gmail.com_
