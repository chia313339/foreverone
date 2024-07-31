import os
from PIL import Image

def convert_images_to_webp(directory):
    print(f"Converting images in directory: {directory}")
    for root, dirs, files in os.walk(directory):
        for filename in files:
            print(f"Processing file: {filename}")
            try:
                if filename.endswith(".webp") or filename.endswith(".png") or filename.endswith(".webp"):
                    filepath = os.path.join(root, filename)
                    print(f"Opening image: {filepath}")
                    img = Image.open(filepath)
                    webp_filepath = os.path.splitext(filepath)[0] + ".webp"
                    print(f"Saving as WebP: {webp_filepath}")
                    img.save(webp_filepath, "webp")
                    print(f"Converted {filepath} to {webp_filepath}")
                else:
                    print(f"Skipped {filename}, not a supported image file")
            except Exception as e:
                print(f"Failed to convert {filename}: {e}")


directory = r"C:\Users\LEE_S\Downloads\龍少\202408中悅恆\恆ONE\img"

convert_images_to_webp(directory)
