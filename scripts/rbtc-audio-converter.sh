#!/bin/bash
# This script show what should be done to correctly convert a audio file from a rbtc class. Simply run this script in the folder where the .WAV files are located and it will auto create a folder "bearbeitet" with the converted files.

# Function to check if a package is installed
check_package() {
    if brew ls --versions "$1" >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Array of required packages
required_packages=("ffmpeg" "eye-d3")

# Check if each required package is installed
for package in "${required_packages[@]}"; do
    if ! check_package "$package"; then
        read -p "Package '$package' is not installed. Do you want to install it with Homebrew? (y/n): " answer
        case "$answer" in
        [yY] | [yY][eE][sS])
            brew install "$package"
            ;;
        *)
            echo "Stopping script. Please install '$package' manually and rerun the script."
            exit 1
            ;;
        esac
    fi
done

# Ask for user input
read -p "Enter Subject (Fachkürzel): " subject_code
read -p "Enter City: " city
read -p "Enter Teacher (Lehrerkürzel): " teacher_code

# Path to your cover image
cover_image_path="/Users/bockdar/Documents/RBTC audio/logo.jpg"

# Destination folder for processed files
destination_folder="../bearbeitet"

# Create the destination folder if it doesn't exist
mkdir -p "$destination_folder"

# Loop through WAV files in the current directory
index=1
for file in *.WAV *.wav; do
    if [ -e "$file" ]; then
        # Extract information from the filename
        filename=$(basename "$file")
        extension="${filename##*.}"
        filename_no_ext="${filename%.*}"

        # Parse the filename to extract date and time
        IFS='_' read -r full_year month_day time <<<"$filename_no_ext"
        year=${full_year:2:2} # Extract the last two digits of the year
        month=${month_day:0:2}
        day=${month_day:2:2}

        # Format the track index with leading zero if necessary
        track_index=$(printf "%02d" $index)

        # Get file creation date (year only)
        CREATION_YEAR=$(stat -f %SB -t "%Y" "$MP3_FILE")

        # Set the new filename in the format "YearMonthDay Fachkürzel Aufnahmenummer City Lehrerkürzel"
        new_filename="${year}${month}${day} ${subject_code} ${track_index} ${city} ${teacher_code}"
        destination_path="${destination_folder}/${new_filename}.mp3"

        # Convert audio file to MP3 format with 192k bitrate and remove silence from the end (stop when silence below -35dB lasts for 0.5 seconds)
        ffmpeg -i "$file" -codec:a libmp3lame -b:a 192k -af "silenceremove=stop_periods=-1:stop_threshold=-35dB:stop_duration=0.5" "$destination_path"

        # Update cover art, author tag, and rename the file
        eyeD3 --add-image="$cover_image_path":FRONT_COVER "$destination_path"
        eyeD3 --artist="$teacher_code" "$destination_path"
        eyeD3 --title="$new_filename" "$destination_path"
        eyeD3 --album="$subject_code" "$destination_path"
        eyeD3 --track="$track_index" "$destination_path"
        eyeD3 --recording-date="$CREATION_YEAR" "$destination_path"
        eyeD3 --to-v2.4 "$destination_path"

        index=$((index + 1))

        # Optionally, remove the original WAV file
        # rm "$file"
    fi
done

echo "Conversion and metadata update complete."
