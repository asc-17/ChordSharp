using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChordSharp.Data;
using ChordSharp.Models;

namespace ChordSharp.Controllers;

public class SongsController : Controller
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SongsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET: / or /Songs
    public async Task<IActionResult> Index()
    {
        var songs = await _db.Songs
            .OrderByDescending(s => s.UpdatedAt)
            .ToListAsync();
        return View(songs);
    }

    // GET: /Songs/Create
    public IActionResult Create()
    {
        return View();
    }

    // POST: /Songs/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(
        [Bind("Id,Title,Artist,Album,Lyrics,StrummingPattern,Notes,SpotifyLink")] Song song,
        IFormFile? coverFile,
        IFormFile? audioFile,
        string? audioLabel,
        string? youtubeLinks)
    {
        if (string.IsNullOrWhiteSpace(song.Title))
            ModelState.AddModelError("Title", "Title is required.");
        if (string.IsNullOrWhiteSpace(song.Lyrics))
            ModelState.AddModelError("Lyrics", "Lyrics are required.");

        if (!ModelState.IsValid)
            return View(song);

        song.CreatedAt = DateTime.UtcNow;
        song.UpdatedAt = DateTime.UtcNow;
        song.ChordsJson = "[]";

        // Parse YouTube links
        if (!string.IsNullOrWhiteSpace(youtubeLinks))
        {
            var ytLines = youtubeLinks.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            var ytObjects = new List<ChordSharp.Models.YouTubeLink>();
            foreach (var line in ytLines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;
                var sepIdx = trimmed.IndexOf('|');
                if (sepIdx > -1)
                {
                    ytObjects.Add(new ChordSharp.Models.YouTubeLink 
                    { 
                        Label = trimmed.Substring(0, sepIdx).Trim(), 
                        Url = trimmed.Substring(sepIdx + 1).Trim() 
                    });
                }
                else
                {
                    ytObjects.Add(new ChordSharp.Models.YouTubeLink { Label = "YouTube", Url = trimmed });
                }
            }
            song.YoutubeLinksJson = System.Text.Json.JsonSerializer.Serialize(ytObjects);
        }

        _db.Songs.Add(song);
        await _db.SaveChangesAsync();

        // Handle Cover Upload
        if (coverFile != null && coverFile.Length > 0)
        {
            var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(coverFile.FileName).ToLowerInvariant();
            if (allowedExts.Contains(ext))
            {
                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "covers");
                Directory.CreateDirectory(uploadsDir);
                var newFileName = $"{song.Id}_{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadsDir, newFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await coverFile.CopyToAsync(stream);
                }
                song.CoverImageFileName = newFileName;
            }
        }

        // Handle Audio Upload
        if (audioFile != null && audioFile.Length > 0)
        {
            var allowedExts = new[] { ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".webm" };
            var ext = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
            if (allowedExts.Contains(ext))
            {
                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "audio");
                Directory.CreateDirectory(uploadsDir);
                var track = new AudioTrack
                {
                    Label = string.IsNullOrWhiteSpace(audioLabel) ? "Track" : audioLabel.Trim(),
                    FileName = $"{song.Id}_{Guid.NewGuid():N}{ext}"
                };
                var filePath = Path.Combine(uploadsDir, track.FileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await audioFile.CopyToAsync(stream);
                }
                var tracks = new List<AudioTrack> { track };
                song.AudioFilesJson = System.Text.Json.JsonSerializer.Serialize(tracks);
            }
        }

        if (coverFile != null || audioFile != null)
        {
            song.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return RedirectToAction("View", new { id = song.Id, editMode = "true" });
    }

    // GET: /Songs/View/5
    [Route("Songs/View/{id}")]
    public async Task<IActionResult> View(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();
        return View(song);
    }

    // GET: /Songs/EditChords/5
    public async Task<IActionResult> EditChords(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();
        return View(song);
    }

    // POST: /Songs/SaveChords/5 (AJAX)
    [HttpPost]
    public async Task<IActionResult> SaveChords(int id, [FromBody] SaveChordsRequest request)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        song.ChordsJson = request.ChordsJson;
        song.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // GET: /Songs/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();
        return View(song);
    }

    // POST: /Songs/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Song updated, IFormFile? audioFile, string? audioLabel)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        song.Title = updated.Title;
        song.Artist = updated.Artist;
        song.Album = updated.Album;
        song.Lyrics = updated.Lyrics;
        song.StrummingPattern = updated.StrummingPattern;
        song.Notes = updated.Notes;
        song.UpdatedAt = DateTime.UtcNow;

        // Handle audio file upload
        if (audioFile != null && audioFile.Length > 0)
        {
            var allowedExts = new[] { ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".webm" };
            var ext = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
            if (allowedExts.Contains(ext))
            {
                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "audio");
                Directory.CreateDirectory(uploadsDir);

                var track = new AudioTrack
                {
                    Label = string.IsNullOrWhiteSpace(audioLabel) ? "Track" : audioLabel.Trim(),
                    FileName = $"{song.Id}_{Guid.NewGuid():N}{ext}"
                };

                var filePath = Path.Combine(uploadsDir, track.FileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await audioFile.CopyToAsync(stream);
                }

                var tracks = new List<AudioTrack>();
                if (!string.IsNullOrEmpty(song.AudioFilesJson))
                {
                    try
                    {
                        tracks = System.Text.Json.JsonSerializer.Deserialize<List<AudioTrack>>(song.AudioFilesJson) ?? new List<AudioTrack>();
                    }
                    catch { }
                }

                tracks.Add(track);
                song.AudioFilesJson = System.Text.Json.JsonSerializer.Serialize(tracks);
            }
        }

        await _db.SaveChangesAsync();
        return RedirectToAction("View", new { id = song.Id });
    }

    // POST: /Songs/RemoveAudio/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RemoveAudio(int id, string trackId)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(song.AudioFilesJson))
        {
            var tracks = new List<AudioTrack>();
            try
            {
                tracks = System.Text.Json.JsonSerializer.Deserialize<List<AudioTrack>>(song.AudioFilesJson) ?? new List<AudioTrack>();
            }
            catch { }

            var trackToRemove = tracks.FirstOrDefault(t => t.Id == trackId);
            if (trackToRemove != null)
            {
                var filePath = Path.Combine(_env.WebRootPath, "uploads", "audio", trackToRemove.FileName);
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

                tracks.Remove(trackToRemove);
                song.AudioFilesJson = System.Text.Json.JsonSerializer.Serialize(tracks);
                song.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        return RedirectToAction("Edit", new { id });
    }

    // POST: /Songs/Delete/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        // Clean up audio files
        if (!string.IsNullOrEmpty(song.AudioFilesJson))
        {
            try
            {
                var tracks = System.Text.Json.JsonSerializer.Deserialize<List<AudioTrack>>(song.AudioFilesJson);
                if (tracks != null)
                {
                    foreach (var track in tracks)
                    {
                        var filePath = Path.Combine(_env.WebRootPath, "uploads", "audio", track.FileName);
                        if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
                    }
                }
            }
            catch { }
        }

        // Clean up cover image
        if (!string.IsNullOrEmpty(song.CoverImageFileName))
        {
            var coverPath = Path.Combine(_env.WebRootPath, "uploads", "covers", song.CoverImageFileName);
            if (System.IO.File.Exists(coverPath)) System.IO.File.Delete(coverPath);
        }

        _db.Songs.Remove(song);
        await _db.SaveChangesAsync();
        return RedirectToAction("Index");
    }

    // POST: /Songs/ToggleFavorite/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        song.IsFavorite = !song.IsFavorite;
        song.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // If it's an AJAX request, return Ok, otherwise redirect
        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return Ok(new { isFavorite = song.IsFavorite });
        }
        
        return RedirectToAction("Index");
    }

    // POST: /Songs/ToggleArchive/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleArchive(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        song.IsArchived = !song.IsArchived;
        song.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return Ok(new { isArchived = song.IsArchived });
        }
        
        return RedirectToAction("Index");
    }
    // POST: /Songs/UpdateInline/5 (AJAX)
    [HttpPost]
    public async Task<IActionResult> UpdateInline(int id, [FromBody] SongUpdateInlineRequest request)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Title)) song.Title = request.Title;
        if (request.Artist != null) song.Artist = request.Artist;
        if (request.Album != null) song.Album = request.Album;
        if (!string.IsNullOrWhiteSpace(request.Lyrics)) song.Lyrics = request.Lyrics;
        if (request.StrummingPattern != null) song.StrummingPattern = request.StrummingPattern;
        if (request.Notes != null) song.Notes = request.Notes;
        if (request.SpotifyLink != null) song.SpotifyLink = request.SpotifyLink;
        if (request.YoutubeLinksJson != null) song.YoutubeLinksJson = request.YoutubeLinksJson;
        
        if (request.ChordsJson != null) song.ChordsJson = request.ChordsJson;
        
        song.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // POST: /Songs/UploadCover/5
    [HttpPost]
    public async Task<IActionResult> UploadCover(int id, IFormFile? coverFile)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (coverFile != null && coverFile.Length > 0)
        {
            var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(coverFile.FileName).ToLowerInvariant();
            if (!allowedExts.Contains(ext))
                return BadRequest("Invalid file type. Use JPG, PNG, or WebP.");

            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "covers");
            Directory.CreateDirectory(uploadsDir);

            // Delete old cover if exists
            if (!string.IsNullOrEmpty(song.CoverImageFileName))
            {
                var oldPath = Path.Combine(uploadsDir, song.CoverImageFileName);
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            var newFileName = $"{song.Id}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, newFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await coverFile.CopyToAsync(stream);
            }

            song.CoverImageFileName = newFileName;
            song.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, fileName = newFileName });
        }

        return BadRequest("No file provided.");
    }

    // POST: /Songs/RemoveCover/5
    [HttpPost]
    public async Task<IActionResult> RemoveCover(int id)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(song.CoverImageFileName))
        {
            var filePath = Path.Combine(_env.WebRootPath, "uploads", "covers", song.CoverImageFileName);
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

            song.CoverImageFileName = null;
            song.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    // POST: /Songs/UploadAudioInline/5
    [HttpPost]
    public async Task<IActionResult> UploadAudioInline(int id, IFormFile? audioFile, string? audioLabel)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (audioFile != null && audioFile.Length > 0)
        {
            var allowedExts = new[] { ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".webm" };
            var ext = Path.GetExtension(audioFile.FileName).ToLowerInvariant();
            if (allowedExts.Contains(ext))
            {
                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "audio");
                Directory.CreateDirectory(uploadsDir);

                var track = new AudioTrack
                {
                    Label = string.IsNullOrWhiteSpace(audioLabel) ? "Track" : audioLabel.Trim(),
                    FileName = $"{song.Id}_{Guid.NewGuid():N}{ext}"
                };

                var filePath = Path.Combine(uploadsDir, track.FileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await audioFile.CopyToAsync(stream);
                }

                var tracks = new List<AudioTrack>();
                if (!string.IsNullOrEmpty(song.AudioFilesJson))
                {
                    try { tracks = System.Text.Json.JsonSerializer.Deserialize<List<AudioTrack>>(song.AudioFilesJson) ?? new List<AudioTrack>(); }
                    catch { }
                }

                tracks.Add(track);
                song.AudioFilesJson = System.Text.Json.JsonSerializer.Serialize(tracks);
                song.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
        
        return RedirectToAction("View", new { id = song.Id });
    }

    // Also clean up cover image on song delete
    // (Update the existing Delete method to handle cover cleanup)

    // POST: /Songs/DeleteAudioTrack/5
    [HttpPost]
    public async Task<IActionResult> DeleteAudioTrack(int id, string fileName)
    {
        var song = await _db.Songs.FindAsync(id);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(song.AudioFilesJson))
        {
            try
            {
                var tracks = System.Text.Json.JsonSerializer.Deserialize<List<AudioTrack>>(song.AudioFilesJson) ?? new List<AudioTrack>();
                var trackToRemove = tracks.FirstOrDefault(t => t.FileName == fileName);
                
                if (trackToRemove != null)
                {
                    tracks.Remove(trackToRemove);
                    song.AudioFilesJson = System.Text.Json.JsonSerializer.Serialize(tracks);
                    song.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();

                    var filePath = Path.Combine(_env.WebRootPath, "uploads", "audio", trackToRemove.FileName);
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
            }
            catch { }
        }

        return Ok(new { success = true });
    }
}

public class SaveChordsRequest
{
    public string ChordsJson { get; set; } = "[]";
}

public class SongUpdateInlineRequest
{
    public string? Title { get; set; }
    public string? Artist { get; set; }
    public string? Album { get; set; }
    public string? Lyrics { get; set; }
    public string? ChordsJson { get; set; }
    public string? StrummingPattern { get; set; }
    public string? Notes { get; set; }
    public string? SpotifyLink { get; set; }
    public string? YoutubeLinksJson { get; set; }
}
