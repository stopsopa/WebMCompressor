// This script intercepts process.emit to silence the "Transform Types" experimental warning.
const originalEmit = process.emit;
process.emit = function (name, data) {
  const message = data?.message;
  const warningName = data?.name;
  if (
    name === "warning" &&
    data &&
    ((warningName === "ExperimentalWarning" &&
      message?.includes("Transform Types")) ||
      (typeof data === "string" && data.includes("Transform Types")))
  ) {
    return false;
  }
  return originalEmit.apply(this, arguments);
};
