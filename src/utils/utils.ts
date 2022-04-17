export const fileSize = (size: number): string => {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const fromStreamToFile = async (
  stream: ReadableStream,
  filename: string
): Promise<File> => {
  const reader = stream.getReader();
  const chunks: BlobPart[] = [];

  const readFile = async () => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    chunks.push(value);
    return readFile();
  };

  await readFile();
  return new File(chunks, filename, { type: 'text/plain' });
};
