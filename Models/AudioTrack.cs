namespace ChordSharp.Models;

public class AudioTrack
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Label { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}
