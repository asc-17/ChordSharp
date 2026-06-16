using Microsoft.EntityFrameworkCore;
using ChordSharp.Models;

namespace ChordSharp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Song> Songs => Set<Song>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed sample data: Drag Path
        modelBuilder.Entity<Song>().HasData(
            new Song
            {
                Id = 1,
                Title = "Drag Path",
                Artist = "Unknown Artist",
                Lyrics = @"[Verse 1]
When I see the devil's eyes
I'll look away and smile wide
You found me
Then I'll know you're also there
'Cause proof is in the adversaire
You found me

[Chorus]
A drag path etched in the surface
As evidence I left there on purpose
A sad sap laying on the surface
Can you find me?

[Verse 2]
When I see the devil's eyes
A current travels down my spine
You found me

[Chorus]
A drag path etched in the surface
As evidence I left there on purpose
A sad sap laying on the surface
Can you find me?
I dug my heels into the gravel
As evidence for you to unravel
A drag path etched in the surface
Can you find me?

[Bridge]
Can you, can you, can you, can you?

[Chorus]
A drag path etched in the surface
As evidence I left there on purpose
A sad sap laying on the surface
(Can you, can you find me?) Can you find me?
I dug my heels into the gravel
As evidence for you to unravel
A drag path etched in the surface
Can you find me?",
                ChordsJson = @"[
{""lineIndex"":1,""charIndex"":0,""chord"":""Em""},{""lineIndex"":1,""charIndex"":22,""chord"":""G""},
{""lineIndex"":2,""charIndex"":0,""chord"":""D""},{""lineIndex"":2,""charIndex"":22,""chord"":""A""},
{""lineIndex"":3,""charIndex"":0,""chord"":""G""},{""lineIndex"":3,""charIndex"":11,""chord"":""A""},
{""lineIndex"":4,""charIndex"":0,""chord"":""Em""},{""lineIndex"":4,""charIndex"":23,""chord"":""G""},
{""lineIndex"":5,""charIndex"":0,""chord"":""D""},{""lineIndex"":5,""charIndex"":23,""chord"":""A""},
{""lineIndex"":6,""charIndex"":0,""chord"":""G""},{""lineIndex"":6,""charIndex"":11,""chord"":""A""},
{""lineIndex"":9,""charIndex"":0,""chord"":""Em""},{""lineIndex"":9,""charIndex"":19,""chord"":""G""},
{""lineIndex"":10,""charIndex"":0,""chord"":""D""},{""lineIndex"":10,""charIndex"":19,""chord"":""A""},
{""lineIndex"":11,""charIndex"":0,""chord"":""Em""},{""lineIndex"":11,""charIndex"":9,""chord"":""G""},{""lineIndex"":11,""charIndex"":20,""chord"":""D""},{""lineIndex"":11,""charIndex"":29,""chord"":""A""},
{""lineIndex"":15,""charIndex"":0,""chord"":""Em""},{""lineIndex"":15,""charIndex"":22,""chord"":""G""},
{""lineIndex"":16,""charIndex"":0,""chord"":""D""},{""lineIndex"":16,""charIndex"":22,""chord"":""A""},
{""lineIndex"":17,""charIndex"":0,""chord"":""G""},{""lineIndex"":17,""charIndex"":11,""chord"":""A""},
{""lineIndex"":20,""charIndex"":0,""chord"":""Em""},{""lineIndex"":20,""charIndex"":19,""chord"":""G""},
{""lineIndex"":21,""charIndex"":0,""chord"":""D""},{""lineIndex"":21,""charIndex"":19,""chord"":""A""},
{""lineIndex"":22,""charIndex"":0,""chord"":""Em""},{""lineIndex"":22,""charIndex"":9,""chord"":""G""},{""lineIndex"":22,""charIndex"":20,""chord"":""D""},{""lineIndex"":22,""charIndex"":29,""chord"":""A""},
{""lineIndex"":24,""charIndex"":0,""chord"":""Em""},{""lineIndex"":24,""charIndex"":19,""chord"":""G""},
{""lineIndex"":25,""charIndex"":0,""chord"":""D""},{""lineIndex"":25,""charIndex"":19,""chord"":""A""},
{""lineIndex"":26,""charIndex"":0,""chord"":""Em""},{""lineIndex"":26,""charIndex"":11,""chord"":""G""},{""lineIndex"":26,""charIndex"":20,""chord"":""D""},{""lineIndex"":26,""charIndex"":29,""chord"":""A""},
{""lineIndex"":29,""charIndex"":0,""chord"":""Em""},{""lineIndex"":29,""charIndex"":7,""chord"":""G""},{""lineIndex"":29,""charIndex"":20,""chord"":""D""},{""lineIndex"":29,""charIndex"":33,""chord"":""A""},
{""lineIndex"":32,""charIndex"":0,""chord"":""Em""},{""lineIndex"":32,""charIndex"":19,""chord"":""G""},
{""lineIndex"":33,""charIndex"":0,""chord"":""D""},{""lineIndex"":33,""charIndex"":19,""chord"":""A""},
{""lineIndex"":34,""charIndex"":0,""chord"":""Em""},{""lineIndex"":34,""charIndex"":9,""chord"":""G""},{""lineIndex"":34,""charIndex"":20,""chord"":""D""},{""lineIndex"":34,""charIndex"":29,""chord"":""A""},
{""lineIndex"":36,""charIndex"":0,""chord"":""Em""},{""lineIndex"":36,""charIndex"":19,""chord"":""G""},
{""lineIndex"":37,""charIndex"":0,""chord"":""D""},{""lineIndex"":37,""charIndex"":19,""chord"":""A""},
{""lineIndex"":38,""charIndex"":0,""chord"":""Em""},{""lineIndex"":38,""charIndex"":11,""chord"":""G""},{""lineIndex"":38,""charIndex"":20,""chord"":""D""},{""lineIndex"":38,""charIndex"":29,""chord"":""A""}
]",
                StrummingPattern = "",
                Notes = "",
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            // Seed sample data: Looking for an Answer (LOAA) by Linkin Park
            new Song
            {
                Id = 2,
                Title = "Looking for an Answer",
                Artist = "Linkin Park",
                Lyrics = @"[Verse 1]
There's an emptiness tonight,  a hole that wasn't there before
And I keep reaching for the light,  but I can't find it anymore
There's an emptiness tonight,  a heavy hand that pulls me down
They say it's gonna be alright,  can't begin to tell me how

[Pre-Chorus]
And I ask myself out loud

[Chorus]
Have I been lost  all  along?
Was there something I could say or something I should not have done?
Was I lost  all  along?
Was I looking for an answer when there never really was one?
Was I looking for an answer when there never really was one?

[Verse 2]
Is there sunshine where you are,  the way there was when you were here
'Cause I'm just sitting in the dark,  in disbelief that this is real
In disbelief that this is real

[Pre-Chorus]
And I ask myself out loud

[Chorus]
Have I been lost  all  along?
Was there something I could say or something I should not have done?
Was I lost  all  along?
Was I looking for an answer when there never really was one?
Was I looking for an answer when there never really was one?",
                ChordsJson = @"[
{""lineIndex"":1,""charIndex"":0,""chord"":""Am""},{""lineIndex"":1,""charIndex"":10,""chord"":""G""},{""lineIndex"":1,""charIndex"":18,""chord"":""D""},
{""lineIndex"":2,""charIndex"":0,""chord"":""Am""},{""lineIndex"":2,""charIndex"":10,""chord"":""G""},{""lineIndex"":2,""charIndex"":18,""chord"":""D""},
{""lineIndex"":3,""charIndex"":0,""chord"":""Am""},{""lineIndex"":3,""charIndex"":10,""chord"":""G""},{""lineIndex"":3,""charIndex"":18,""chord"":""D""},
{""lineIndex"":4,""charIndex"":0,""chord"":""F""},{""lineIndex"":4,""charIndex"":10,""chord"":""Am""},{""lineIndex"":4,""charIndex"":18,""chord"":""G""},
{""lineIndex"":7,""charIndex"":0,""chord"":""Am""},{""lineIndex"":7,""charIndex"":10,""chord"":""G""},
{""lineIndex"":10,""charIndex"":0,""chord"":""Am""},{""lineIndex"":10,""charIndex"":10,""chord"":""C""},{""lineIndex"":10,""charIndex"":18,""chord"":""G""},
{""lineIndex"":11,""charIndex"":0,""chord"":""Am""},{""lineIndex"":11,""charIndex"":14,""chord"":""C""},{""lineIndex"":11,""charIndex"":28,""chord"":""G""},
{""lineIndex"":12,""charIndex"":0,""chord"":""F""},{""lineIndex"":12,""charIndex"":5,""chord"":""Am""},{""lineIndex"":12,""charIndex"":13,""chord"":""C""},{""lineIndex"":12,""charIndex"":18,""chord"":""G""},
{""lineIndex"":13,""charIndex"":0,""chord"":""Am""},{""lineIndex"":13,""charIndex"":13,""chord"":""C""},{""lineIndex"":13,""charIndex"":27,""chord"":""G""},
{""lineIndex"":14,""charIndex"":0,""chord"":""F""},{""lineIndex"":14,""charIndex"":5,""chord"":""Am""},{""lineIndex"":14,""charIndex"":13,""chord"":""C""},{""lineIndex"":14,""charIndex"":18,""chord"":""G""},{""lineIndex"":14,""charIndex"":30,""chord"":""F""},
{""lineIndex"":17,""charIndex"":0,""chord"":""Am""},{""lineIndex"":17,""charIndex"":8,""chord"":""G""},{""lineIndex"":17,""charIndex"":18,""chord"":""D""},
{""lineIndex"":18,""charIndex"":0,""chord"":""Am""},{""lineIndex"":18,""charIndex"":10,""chord"":""G""},{""lineIndex"":18,""charIndex"":18,""chord"":""D""},
{""lineIndex"":19,""charIndex"":0,""chord"":""F""},{""lineIndex"":19,""charIndex"":5,""chord"":""Am""},{""lineIndex"":19,""charIndex"":16,""chord"":""G""},
{""lineIndex"":22,""charIndex"":0,""chord"":""Am""},{""lineIndex"":22,""charIndex"":10,""chord"":""G""},
{""lineIndex"":25,""charIndex"":0,""chord"":""Am""},{""lineIndex"":25,""charIndex"":10,""chord"":""C""},{""lineIndex"":25,""charIndex"":18,""chord"":""G""},
{""lineIndex"":26,""charIndex"":0,""chord"":""Am""},{""lineIndex"":26,""charIndex"":14,""chord"":""C""},{""lineIndex"":26,""charIndex"":28,""chord"":""G""},
{""lineIndex"":27,""charIndex"":0,""chord"":""F""},{""lineIndex"":27,""charIndex"":5,""chord"":""Am""},{""lineIndex"":27,""charIndex"":13,""chord"":""C""},{""lineIndex"":27,""charIndex"":18,""chord"":""G""},
{""lineIndex"":28,""charIndex"":0,""chord"":""Am""},{""lineIndex"":28,""charIndex"":13,""chord"":""C""},{""lineIndex"":28,""charIndex"":27,""chord"":""G""},
{""lineIndex"":29,""charIndex"":0,""chord"":""F""},{""lineIndex"":29,""charIndex"":5,""chord"":""Am""},{""lineIndex"":29,""charIndex"":13,""chord"":""C""},{""lineIndex"":29,""charIndex"":18,""chord"":""G""},{""lineIndex"":29,""charIndex"":30,""chord"":""F""}
]",
                StrummingPattern = "D U D - D U - U",
                Notes = "Capo 3rd fret. Chester performed this at the Chester Bennington tribute concert. Very emotional, play softly.",
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
