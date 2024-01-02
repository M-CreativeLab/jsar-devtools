export function correctVscodePath(fsPath: string): string {
  if (process.platform === 'win32') {
    /**
     * FIXME(Yorkie): in Windows platform, it's better to normalize the following paths:
     *                "d:\foo\bar" => "d:/foo/bar"
     * 
     * Reason:
     * See https://code.visualstudio.com/api/references/vscode-api fsPath description, it returns the single \
     * which causes Node.js `path` module not working because the single \ is a special char for unescaping.
     * 
     * Solution:
     * Just replace all single \ to / resolve this problem.
     */
    return fsPath.replace(/\\/g, '/');
  } else {
    return fsPath;
  }
}

export function attrsToMap(attrs: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < attrs.length; i += 2) {
    map.set(attrs[i], attrs[i + 1]);
  }
  return map;
}
