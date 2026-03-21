import os
import unicodedata

def fix_nfc():
    path = "app/static/images"
    for filename in os.listdir(path):
        nfc_filename = unicodedata.normalize('NFC', filename)
        if filename != nfc_filename:
            os.rename(os.path.join(path, filename), os.path.join(path, nfc_filename))
            print(f"Renamed: {filename} -> {nfc_filename}")

if __name__ == "__main__":
    fix_nfc()
