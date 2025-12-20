import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db } from "./firebase";
import imageCompression from "browser-image-compression";
import { getApp } from "firebase/app";

const storage = getStorage(getApp());

export async function compressImage(file: File): Promise<File> {
  if (file.size < 500 * 1024) {
    return file;
  }
  
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.7,
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file;
  }
}

export async function uploadRecipeImage(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to upload images");
  }
  
  const compressedFile = await compressImage(file);
  
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `recipes/${user.uid}/${timestamp}-${safeName}`;
  
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, compressedFile, {
    contentType: compressedFile.type,
  });
  
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

export async function deleteRecipeImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}
