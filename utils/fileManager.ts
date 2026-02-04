import * as FileSystem from "expo-file-system/legacy";

const BASE_DIR =
  ((FileSystem as any).documentDirectory || "") + "MaayosGrader/";

export interface ExamMetadata {
  id: string;
  schoolYear: string;
  section: string;
  subject: string;
  keyMode: "scan" | "manual";
  createdAt: string;
}

export const ensureBaseDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(BASE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BASE_DIR, { intermediates: true });
  }
};

export const createExamFolder = async (
  meta: Omit<ExamMetadata, "id" | "createdAt">,
): Promise<ExamMetadata> => {
  await ensureBaseDir();

  // Sanitize folder name
  const safeSection = meta.section.replace(/[^a-z0-9]/gi, "_");
  const safeSubject = meta.subject.replace(/[^a-z0-9]/gi, "_");
  const folderName = `${meta.schoolYear}_${safeSection}_${safeSubject}_${Date.now()}`;
  const folderPath = BASE_DIR + folderName;

  await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

  const newExam: ExamMetadata = {
    ...meta,
    id: folderName,
    createdAt: new Date().toISOString(),
  };

  await FileSystem.writeAsStringAsync(
    folderPath + "/metadata.json",
    JSON.stringify(newExam),
  );

  return newExam;
};

export const saveCapturedImage = async (folderId: string, imageUri: string) => {
  const folderPath = BASE_DIR + folderId;
  const fileName = `scan_${Date.now()}.jpg`;
  const destination = folderPath + "/" + fileName;

  await FileSystem.copyAsync({
    from: imageUri,
    to: destination,
  });

  return destination;
};

export const getExams = async (): Promise<ExamMetadata[]> => {
  await ensureBaseDir();
  const items = await FileSystem.readDirectoryAsync(BASE_DIR);
  const exams: ExamMetadata[] = [];

  for (const item of items) {
    const metadataPath = BASE_DIR + item + "/metadata.json";
    const info = await FileSystem.getInfoAsync(metadataPath);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(metadataPath);
      try {
        exams.push(JSON.parse(content));
      } catch (e) {
        console.error("Failed to parse metadata for", item);
      }
    }
  }

  return exams.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getImagesForFolder = async (
  folderId: string,
): Promise<string[]> => {
  try {
    const folderPath = BASE_DIR + folderId;
    const files = await FileSystem.readDirectoryAsync(folderPath);
    return files
      .filter(
        (file) =>
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg") ||
          file.endsWith(".png"),
      )
      .map((file) => folderPath + "/" + file)
      .reverse(); // Show newest first
  } catch (e) {
    console.error("Failed to get images", e);
    return [];
  }
};

interface ScanResult {
  id: string; // The filename of the image
  studentName: string;
  score: number;
  total: number;
  status: "success" | "review";
}

export const getResults = async (folderId: string): Promise<ScanResult[]> => {
  try {
    const path = BASE_DIR + folderId + "/results.json";
    const exists = await FileSystem.getInfoAsync(path);
    if (!exists.exists) return [];

    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to read results", e);
    return [];
  }
};

export const saveResults = async (folderId: string, results: ScanResult[]) => {
  try {
    const path = BASE_DIR + folderId + "/results.json";
    await FileSystem.writeAsStringAsync(path, JSON.stringify(results));
  } catch (e) {
    console.error("Failed to save results", e);
  }
};
