using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChordSharp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VariantsJson",
                table: "Songs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Songs",
                keyColumn: "Id",
                keyValue: 1,
                column: "VariantsJson",
                value: null);

            migrationBuilder.UpdateData(
                table: "Songs",
                keyColumn: "Id",
                keyValue: 2,
                column: "VariantsJson",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VariantsJson",
                table: "Songs");
        }
    }
}
