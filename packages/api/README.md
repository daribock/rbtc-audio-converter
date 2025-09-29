# RBTC Audio Converter Backend

The backend for the RBTC Audio Converter.

## Install

```
npm install
```

## Usage

### Start via docker compose

#### For test

```
docker-compose up
```

#### For production

```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Process explained

- Upload WAV files
- Convert WAV files to MP3 via ffmpeg
- Create zip folder with MP3 files
- Send email with zip folder attached via mailgun
- Delete job files after 3 days
