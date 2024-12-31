const Jimp = require("jimp");
const path = require("path")

const addCoordinateMarks = async (localFilePath, latitude, longitude, res) => {
    try {
        console.log(localFilePath);
        const image = await Jimp.read(localFilePath);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
        const companyName = "C-Geeks Systems";
        // Set the background color for the text
        const backgroundColor = Jimp.rgbaToInt(0, 0, 0, 150); // Semi-transparent black
        // Padding around the text
        const padding = 10;
        // Calculate the width of the longest text (companyName or other rows)
        const textWidth = Math.max(
            Jimp.measureText(font, companyName),
            Jimp.measureText(font, latitude),
            Jimp.measureText(font, longitude)
        );
        // Calculate the total height for 3 rows of text (including padding between rows)
        const totalHeight = Jimp.measureTextHeight(font, companyName, textWidth) +
            Jimp.measureTextHeight(font, latitude, textWidth) +
            Jimp.measureTextHeight(font, longitude, textWidth) +
            padding * 4; // Extra padding between lines

        // Get the image dimensions
        const imageWidth = image.bitmap.width;
        const imageHeight = image.bitmap.height;

        // Calculate the position to place the background at the bottom right
        const xPos = imageWidth - textWidth - padding * 2;
        const yPos = imageHeight - totalHeight - padding * 2;
        // Draw the background rectangle for the 3 rows of text at the bottom-right
        image.scan(xPos, yPos, textWidth + padding * 2, totalHeight, function (x, y, idx) {
            this.bitmap.data[idx + 0] = (backgroundColor >> 24) & 0xFF; // Red
            this.bitmap.data[idx + 1] = (backgroundColor >> 16) & 0xFF; // Green
            this.bitmap.data[idx + 2] = (backgroundColor >> 8) & 0xFF;  // Blue
            this.bitmap.data[idx + 3] = backgroundColor & 0xFF;         // Alpha
        });
        // Print the text onto the image at the bottom-right
        image.print(font, xPos + padding, yPos + padding, companyName);
        image.print(font, xPos + padding, yPos + padding + Jimp.measureTextHeight(font, companyName, textWidth) + padding, `Latitude : ${latitude}`);
        image.print(font, xPos + padding, yPos + padding + Jimp.measureTextHeight(font, companyName, textWidth) + padding * 2 + Jimp.measureTextHeight(font, latitude, textWidth), `Longitude : ${longitude}`);
        // Save the image
        image.write(localFilePath);
    } catch (error) {
        res.status(500).json({
            isError: true,
            message: "Internal server error",
            error: error.message,
        });
    }
}


module.exports = addCoordinateMarks