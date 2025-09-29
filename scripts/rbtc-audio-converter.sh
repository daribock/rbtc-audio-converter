#!/bin/bash
# Universal RBTC Audio Converter Script
# Works on Windows (Git Bash/WSL), macOS, and Linux
# Place this script in the folder with your .WAV files and run it

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to detect operating system
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*|MINGW32*|MSYS*|MINGW*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install packages based on OS
install_packages() {
    local os=$(detect_os)

    print_message $BLUE "Detected OS: $os"

    case $os in
        "macos")
            install_macos_packages
            ;;
        "linux")
            install_linux_packages
            ;;
        "windows")
            install_windows_packages
            ;;
        *)
            print_message $RED "Unsupported operating system"
            exit 1
            ;;
    esac
}

# macOS package installation
install_macos_packages() {
    if ! command_exists brew; then
        print_message $RED "Homebrew not found. Please install it from https://brew.sh/"
        exit 1
    fi

    for package in ffmpeg eye-d3; do
        if ! brew list "$package" >/dev/null 2>&1; then
            print_message $YELLOW "Installing $package with Homebrew..."
            brew install "$package"
        fi
    done
}

# Linux package installation
install_linux_packages() {
    # Detect Linux distribution
    if command_exists apt-get; then
        # Debian/Ubuntu
        print_message $YELLOW "Installing packages with apt..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg eyed3
    else
        print_message $RED "Unsupported Linux distribution. Please install ffmpeg and eyed3 manually."
        exit 1
    fi
}

# Windows package installation (Git Bash/WSL)
install_windows_packages() {
    if command_exists apt-get; then
        # WSL Ubuntu
        print_message $YELLOW "Installing packages in WSL..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg eyed3
    else
        print_message $RED "Please install either Chocolatey or use WSL for automatic package installation"
        print_message $YELLOW "Manual installation options:"
        print_message $YELLOW "1. Install Chocolatey: https://chocolatey.org/install"
        print_message $YELLOW "2. Install WSL: wsl --install"
        print_message $YELLOW "3. Or manually install:"
        print_message $YELLOW "   - FFmpeg from https://ffmpeg.org/download.html"
        print_message $YELLOW "   - Python 3 from https://python.org"
        print_message $YELLOW "   - Then run: pip install eyed3"
        exit 1
    fi
}

# Function to check if required tools are available
check_dependencies() {
    local missing_deps=()

    if ! command_exists ffmpeg; then
        missing_deps+=("ffmpeg")
    fi

    if ! command_exists eyeD3; then
        missing_deps+=("eyeD3")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_message $YELLOW "Missing dependencies: ${missing_deps[*]}"
        read -p "Would you like to install them automatically? (y/n): " install_answer
        case "$install_answer" in
            [yY]|[yY][eE][sS])
                install_packages
                ;;
            *)
                print_message $RED "Please install the missing dependencies and run the script again."
                exit 1
                ;;
        esac
    else
        print_message $GREEN "All dependencies are available!"
    fi
}

# Function to find logo file with cross-platform paths
find_logo() {
    local os=$(detect_os)
    local logo_paths=()

    # Common paths for all systems
    logo_paths+=(
        "./logo.jpg"
        "./logo.png"
        "./logo.jpeg"
        "../logo.jpg"
        "../logo.png"
        "../logo.jpeg"
        "./assets/logo.jpg"
        "./assets/logo.png"
        "./assets/logo.jpeg"
        "../assets/logo.jpg"
        "../assets/logo.png"
        "../assets/logo.jpeg"
    )

    # OS-specific paths
    case $os in
        "macos"|"linux")
            logo_paths+=(
                "$HOME/Documents/RBTC audio/logo.jpg"
                "$HOME/Documents/logo.jpg"
                "$HOME/Downloads/logo.jpg"
                "$HOME/Desktop/logo.jpg"
            )
            ;;
        "windows")
            # For Windows/Git Bash/WSL
            if [ -n "$USERPROFILE" ]; then
                logo_paths+=(
                    "$USERPROFILE/Documents/RBTC audio/logo.jpg"
                    "$USERPROFILE/Documents/logo.jpg"
                    "$USERPROFILE/Downloads/logo.jpg"
                    "$USERPROFILE/Desktop/logo.jpg"
                )
            fi
            if [ -n "$USERNAME" ]; then
                logo_paths+=(
                    "/c/Users/$USERNAME/Documents/RBTC audio/logo.jpg"
                    "/c/Users/$USERNAME/Documents/logo.jpg"
                    "/c/Users/$USERNAME/Downloads/logo.jpg"
                    "/c/Users/$USERNAME/Desktop/logo.jpg"
                )
            fi
            ;;
    esac

    for path in "${logo_paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    return 1
}

# Function to get file creation year (cross-platform)
get_creation_year() {
    local file="$1"
    local os=$(detect_os)

    case $os in
        "macos")
            stat -f %SB -t "%Y" "$file" 2>/dev/null || date +%Y
            ;;
        "linux"|"windows")
            stat -c %Y "$file" 2>/dev/null | xargs -I {} date -d @{} +%Y 2>/dev/null || date +%Y
            ;;
        *)
            date +%Y
            ;;
    esac
}

# Main script starts here
clear
print_message $GREEN "Universal RBTC Audio Converter"
print_message $BLUE "Supports Windows, macOS, and Linux"
print_message $BLUE "Detected OS: $(detect_os)"
echo ""

# Start timing
start_time=$(date +%s)

# Check dependencies
check_dependencies

# Ask for user input
echo ""
print_message $YELLOW "Please provide the following information:"
read -p "Enter Subject (Fachkürzel): " subject_code
read -p "Enter City: " city
read -p "Enter Teacher (Lehrerkürzel): " teacher_code

# Validate input
if [ -z "$subject_code" ] || [ -z "$city" ] || [ -z "$teacher_code" ]; then
    print_message $RED "Error: All fields are required!"
    exit 1
fi

# Check for logo file
echo ""
print_message $BLUE "Checking for logo file..."
if logo_path=$(find_logo); then
    print_message $GREEN "Logo found at: $logo_path"
    cover_image_path="$logo_path"
    use_logo=true
else
    print_message $YELLOW "Logo file not found in common locations"
    echo "  Searched in:"
    echo "    - Current directory (./logo.jpg, ./logo.png)"
    echo "    - Parent directory (../logo.jpg, ../logo.png)"
    echo "    - Assets folders (./assets/, ../assets/)"
    echo "    - Documents, Downloads, Desktop folders"
    echo ""
    read -p "Do you want to specify a custom logo path? (y/n): " custom_logo_answer
    case "$custom_logo_answer" in
    [yY]|[yY][eE][sS])
        read -p "Enter the full path to your logo file: " custom_logo_path
        if [ -f "$custom_logo_path" ]; then
            print_message $GREEN "Custom logo found at: $custom_logo_path"
            cover_image_path="$custom_logo_path"
            use_logo=true
        else
            print_message $RED "Custom logo file not found."
            print_message $YELLOW "Proceeding without cover art."
            use_logo=false
        fi
        ;;
    *)
        print_message $YELLOW "Proceeding without cover art."
        use_logo=false
        ;;
    esac
fi

# Destination folder for processed files
destination_folder="../bearbeitet"

# Create the destination folder if it doesn't exist
mkdir -p "$destination_folder"
print_message $GREEN "Created output directory: $destination_folder"

# Check for audio files
shopt -s nullglob 2>/dev/null || true  # Enable nullglob if available
audio_patterns=("*.WAV" "*.wav")
existing_files=()

for pattern in "${audio_patterns[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            existing_files+=("$file")
        fi
    done
done

if [ ${#existing_files[@]} -eq 0 ]; then
    print_message $RED "No audio files found in current directory"
    print_message $YELLOW "Supported formats: WAV, MP3, M4A, FLAC"
    print_message $YELLOW "Make sure you're running this script in the folder containing your audio files."
    exit 1
fi

print_message $GREEN "Found ${#existing_files[@]} audio file(s) to process"
echo ""

# Process files
index=1
successful_conversions=0
failed_conversions=0
processed_files=()
failed_files=()

for file in "${existing_files[@]}"; do
    print_message $BLUE "[$index/${#existing_files[@]}] Processing: $file"

    # Extract information from the filename
    filename=$(basename "$file")
    filename_no_ext="${filename%.*}"

    # Try to parse the filename to extract date and time
    if [[ $filename_no_ext =~ ^([0-9]{4})_([0-9]{4})_([0-9]{4}) ]]; then
        # Format: YYYY_MMDD_HHMM
        full_year="${BASH_REMATCH[1]}"
        month_day="${BASH_REMATCH[2]}"
        time="${BASH_REMATCH[3]}"

        year=${full_year:2:2} # Extract the last two digits of the year
        month=${month_day:0:2}
        day=${month_day:2:2}
    else
        # Fallback: use current date
        current_date=$(date +%y%m%d)
        year=${current_date:0:2}
        month=${current_date:2:2}
        day=${current_date:4:2}
        print_message $YELLOW "  Could not parse date from filename, using current date"
    fi

    # Format the track index with leading zero if necessary
    track_index=$(printf "%02d" $index)

    # Get file creation date (year only)
    creation_year=$(get_creation_year "$file")

    # Set the new filename
    new_filename="${year}${month}${day} ${subject_code} ${track_index} ${city} ${teacher_code}"
    destination_path="${destination_folder}/${new_filename}.mp3"

    # Convert audio file to MP3 format
    print_message $YELLOW "  Converting to MP3..."
    if ffmpeg -i "$file" -codec:a libmp3lame -b:a 192k -af "silenceremove=stop_periods=-1:stop_threshold=-35dB:stop_duration=0.5" "$destination_path" -y >/dev/null 2>&1; then
        print_message $GREEN "  Conversion successful"
        successful_conversions=$((successful_conversions + 1))
        processed_files+=("$new_filename.mp3")
    else
        print_message $RED "  Conversion failed"
        failed_conversions=$((failed_conversions + 1))
        failed_files+=("$file")
        continue
    fi

    # Update metadata
    print_message $YELLOW "  Adding metadata..."

    # Add cover art if available
    if [ "$use_logo" = true ]; then
        eyeD3 --add-image="$cover_image_path":FRONT_COVER "$destination_path" >/dev/null 2>&1
    fi

    # Set metadata tags
    eyeD3 --artist="$teacher_code" "$destination_path" >/dev/null 2>&1
    eyeD3 --title="$new_filename" "$destination_path" >/dev/null 2>&1
    eyeD3 --album="$subject_code" "$destination_path" >/dev/null 2>&1
    eyeD3 --track="$track_index" "$destination_path" >/dev/null 2>&1
    eyeD3 --recording-date="$creation_year" "$destination_path" >/dev/null 2>&1
    eyeD3 --to-v2.4 "$destination_path" >/dev/null 2>&1

    print_message $GREEN "  Metadata added"
    print_message $GREEN "  Created: $new_filename.mp3"

    index=$((index + 1))
    echo ""
done

# Calculate processing time
end_time=$(date +%s)
total_time=$((end_time - start_time))
minutes=$((total_time / 60))
seconds=$((total_time % 60))

# Display comprehensive results
echo ""
print_message $GREEN "CONVERSION COMPLETE!"
print_message $BLUE "=========================================="
print_message $GREEN "PROCESSING STATISTICS:"
print_message $BLUE "  • Total files found: ${#existing_files[@]}"
print_message $GREEN "  • Successfully converted: $successful_conversions"
if [ $failed_conversions -gt 0 ]; then
    print_message $RED "  • Failed conversions: $failed_conversions"
fi
print_message $BLUE "  • Processing time: ${minutes}m ${seconds}s"
print_message $BLUE "  • Output directory: $destination_folder"

if [ $successful_conversions -gt 0 ]; then
    echo ""
    print_message $GREEN "SUCCESSFULLY CONVERTED FILES:"
    for file in "${processed_files[@]}"; do
        print_message $GREEN "  • $file"
    done
fi

if [ $failed_conversions -gt 0 ]; then
    echo ""
    print_message $RED "FAILED CONVERSIONS:"
    for file in "${failed_files[@]}"; do
        print_message $RED "  • $file"
    done
fi

print_message $BLUE "=========================================="

# Optional: Open output folder
case $(detect_os) in
    "macos")
        read -p "Open output folder in Finder? (y/n): " open_folder
        if [[ $open_folder =~ ^[yY] ]]; then
            open "$destination_folder"
        fi
        ;;
    "windows")
        read -p "Open output folder in Explorer? (y/n): " open_folder
        if [[ $open_folder =~ ^[yY] ]]; then
            if command_exists explorer.exe; then
                explorer.exe "$(realpath "$destination_folder")"
            elif command_exists cmd.exe; then
                cmd.exe /c start "$(realpath "$destination_folder")"
            fi
        fi
        ;;
    "linux")
        if command_exists xdg-open; then
            read -p "Open output folder? (y/n): " open_folder
            if [[ $open_folder =~ ^[yY] ]]; then
                xdg-open "$destination_folder"
            fi
        fi
        ;;
esac

print_message $GREEN "Done!"
