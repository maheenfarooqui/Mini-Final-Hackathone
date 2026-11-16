import ImageKit from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_KEY,
});


async function uploadFile(buffer) {
  try {
    console.log("UPLOAD 1: Starting ImageKit upload");
    console.log("UPLOAD 2: Buffer size:", buffer?.length);

    const response = await client.files.upload({
      file: buffer.toString("base64"),
      fileName: "image" + Date.now() + ".jpg",
      folder: "products",
    });

    console.log("UPLOAD 3: ImageKit response received");
    console.log("UPLOAD 4: Uploaded URL:", response.url);

    return response;
  } catch (error) {
    console.error("IMAGEKIT UPLOAD ERROR:", error);
    throw error;
  }
}



export default uploadFile;
