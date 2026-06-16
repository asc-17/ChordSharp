using System.ComponentModel.DataAnnotations;

namespace ChordSharp.Models;

public class Song
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Artist { get; set; }

    [StringLength(200)]
    public string? Album { get; set; }

    [Required]
    public string Lyrics { get; set; } = string.Empty;

    /// <summary>
    /// JSON array of chord placements: [{ "lineIndex": 0, "charIndex": 5, "chord": "Em" }, ...]
    /// </summary>
    public string? ChordsJson { get; set; }

    /// <summary>
    /// Strumming pattern text, e.g. "D DU UDU"
    /// </summary>
    public string? StrummingPattern { get; set; }

    /// <summary>
    /// Free-form notes about the song
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// JSON array of audio files: [{ "id": "guid", "label": "Acapella", "fileName": "abc.mp3" }, ...]
    /// </summary>
    public string? AudioFilesJson { get; set; }

    /// <summary>
    /// Whether the song is marked as a favorite
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// Whether the song is archived and hidden from default views
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Filename of the cover image stored in wwwroot/uploads/covers/
    /// </summary>
    public string? CoverImageFileName { get; set; }

    /// <summary>
    /// URL to Spotify Track
    /// </summary>
    public string? SpotifyLink { get; set; }

    /// <summary>
    /// JSON array of YouTube links: [ "url1", "url2", ... ]
    /// </summary>
    public string? YoutubeLinksJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class YouTubeLink
{
    public string Label { get; set; } = "YouTube";
    public string Url { get; set; } = string.Empty;
}
