using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChordSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SpotifyLink",
                table: "Songs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "YoutubeLinksJson",
                table: "Songs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Songs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "SpotifyLink", "YoutubeLinksJson" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Songs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "SpotifyLink", "YoutubeLinksJson" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpotifyLink",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "YoutubeLinksJson",
                table: "Songs");
        }
    }
}
