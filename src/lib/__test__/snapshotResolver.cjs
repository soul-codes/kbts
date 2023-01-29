const { basename, dirname, resolve, sep } = require("path");

/**
 * @param {string} testPath
 * @param {string} snapshotExtension
 * @returns {string}
 */
function resolveSnapshotPath(testPath, snapshotExtension) {
  const testSourcePath = testPath.replace(sep + "target", sep + "src");
  const testDirectory = dirname(testSourcePath);
  const testFilename = basename(testSourcePath, ".js");
  return resolve(testDirectory, testFilename + ".ts" + snapshotExtension);
}

/**
 * @param {string} snapshotFilePath
 * @param {string} snapshotExtension
 * @returns {string}
 */
function resolveTestPath(snapshotFilePath, snapshotExtension) {
  const testDirectory = dirname(snapshotFilePath).replace(
    sep + "src",
    sep + "target"
  );
  const testFilename =
    basename(snapshotFilePath, ".ts" + snapshotExtension) + ".js";
  return resolve(testDirectory, testFilename);
}

const testPathForConsistencyCheck = resolve(
  process.cwd(),
  "/target/lib/__test__/test.test.js"
);

module.exports = {
  resolveSnapshotPath,
  resolveTestPath,
  testPathForConsistencyCheck,
};
