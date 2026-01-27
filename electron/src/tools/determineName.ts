import path from "path";

function extract(filePath: string) {
  const dirname = path.dirname(filePath);

  const filename = path.basename(filePath, path.extname(filePath));

  const extension = path.extname(filePath).substring(1).toLowerCase();

  const basename = path.basename(filePath);

  return {
    dirname,
    filename,
    extension,
    basename,
  };
}

export default function determineName(file: string, targetExtension: string) {
  const parts = extract(file);

  targetExtension = targetExtension.toLowerCase();

  if (parts.extension === targetExtension) {
    return `${parts.dirname}/${parts.filename}[processed].${targetExtension}`;
  }

  return `${parts.dirname}/${parts.filename}.${targetExtension}`;
}

if (import.meta?.main) {
  const p = determineName(process.argv[2], process.argv[3]);
  process.stdout.write(p);
}
