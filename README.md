# ChordSharp

ChordSharp is a web application built with ASP.NET Core MVC (targeting .NET 10) for managing and organizing your songs, lyrics, and chords.

## Features

- **Song Management**: Add, edit, and organize songs with titles, artists, and albums.
- **Lyrics & Chords**: Keep track of lyrics and specific chord placements. Chords are mapped accurately to the lyrics.
- **Audio & Media**:
  - Attach multiple audio files (e.g., Acapella, Backing Tracks).
  - Link Spotify tracks.
  - Link multiple YouTube videos or tutorials.
- **Organization**: Mark songs as favorites, archive older songs, and add cover images.
- **Practice Tools**: Store strumming patterns and free-form notes for each song.

## Tech Stack

- **Framework**: ASP.NET Core MVC (.NET 10.0)
- **Database**: SQLite (via Entity Framework Core)
- **Front-end**: HTML, CSS, JavaScript (Razor Views)

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)

### Run Locally

1. Clone the repository.
2. Navigate to the project directory:
   ```bash
   cd ChordSharp
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
   *(Note: The application is configured to automatically apply Entity Framework Core migrations and create the SQLite database on startup.)*
4. Open your browser and navigate to the local URL provided in the terminal output (typically `http://localhost:5000` or `https://localhost:5001`).

## Project Structure

- `Controllers/`: Contains the application controllers (e.g., `SongsController`).
- `Models/`: Contains the Entity models, notably the `Song` model representing song data.
- `Views/`: Razor views for the web user interface.
- `Data/`: Entity Framework Core `AppDbContext` and database configurations.
- `wwwroot/`: Static assets including CSS, JS, and user-uploaded media (such as cover images and audio files).

Last Updated 16th June 2026.
