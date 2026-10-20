/**
 * Ambient declarations for Bun's native module specifiers.
 *
 * Bun ships `bun:fs`, `bun:fs/promises` and `bun:path` as *runtime-native*
 * modules — they are Bun's own implementations, not aliases of the Node.js
 * ones — and `bun-types` does not declare them. Without this file the
 * Bun-flavoured import specifiers are untyped and the compiler rejects them.
 *
 * These declarations are written against Bun's API surface, so no source file
 * in this project names a `node:` module. `scripts/doctor.ts` enforces that.
 *
 * The signatures mirror the semantics Bun implements, and deliberately use
 * `Uint8Array` rather than `Buffer` so this file depends on no Node.js type
 * declaration.
 *
 * The file is a *global script* on purpose: it has no top-level `import` or
 * `export`, so the `declare module` blocks below are ambient declarations
 * rather than augmentations of modules that do not exist.
 */

/**
 * The shared shapes behind the `bun:*` modules.
 *
 * A namespace keeps them in one place without putting anything in the global
 * scope beyond this single, clearly named container.
 */
declare namespace BunModules {
  /** Text encodings accepted by the file-system helpers. */
  type FileEncoding =
    | "ascii"
    | "base64"
    | "base64url"
    | "binary"
    | "hex"
    | "latin1"
    | "ucs2"
    | "ucs-2"
    | "utf8"
    | "utf-8"
    | "utf16le"
    | "utf-16le";

  /** Anything that can name a path: a string, a `file:` URL, or raw bytes. */
  type PathLike = string | URL | Uint8Array;

  /** Flags accepted when opening a file. */
  type OpenMode =
    | "a"
    | "ax"
    | "a+"
    | "ax+"
    | "as+"
    | "r"
    | "rs"
    | "r+"
    | "rs+"
    | "w"
    | "wx"
    | "w+"
    | "wx+"
    | "as"
    | "as+";

  /** File metadata, as reported by `statSync` / `lstatSync`. */
  interface Stats {
    /** The file system the path belongs to. */
    dev: number;
    /** Inode number. */
    ino: number;
    /** File mode (permissions and file type bits). */
    mode: number;
    /** Number of hard links. */
    nlink: number;
    /** Owning user id. */
    uid: number;
    /** Owning group id. */
    gid: number;
    /** Device id, for character/block special files. */
    rdev: number;
    /** Size in bytes. */
    size: number;
    /** Preferred I/O block size. */
    blksize: number;
    /** Number of blocks allocated. */
    blocks: number;
    /** Last access time, in milliseconds since the epoch. */
    atimeMs: number;
    /** Last modification time, in milliseconds since the epoch. */
    mtimeMs: number;
    /** Last status change time, in milliseconds since the epoch. */
    ctimeMs: number;
    /** Creation time, in milliseconds since the epoch. */
    birthtimeMs: number;
    /** Last access time. */
    atime: Date;
    /** Last modification time. */
    mtime: Date;
    /** Last status change time. */
    ctime: Date;
    /** Creation time. */
    birthtime: Date;
    /** True for a regular file. */
    isFile(): boolean;
    /** True for a directory. */
    isDirectory(): boolean;
    /** True for a symbolic link. */
    isSymbolicLink(): boolean;
    /** True for a block device. */
    isBlockDevice(): boolean;
    /** True for a character device. */
    isCharacterDevice(): boolean;
    /** True for a FIFO. */
    isFIFO(): boolean;
    /** True for a socket. */
    isSocket(): boolean;
  }

  /** One entry of a directory listing. */
  interface Dirent {
    /** The entry's name, relative to its parent directory. */
    name: string;
    /** True for a regular file. */
    isFile(): boolean;
    /** True for a directory. */
    isDirectory(): boolean;
    /** True for a symbolic link. */
    isSymbolicLink(): boolean;
  }

  /** Options for `readdirSync` / `readdir`. */
  interface ReaddirOptions {
    /** The encoding of the returned names. Defaults to `utf8`. */
    encoding?: FileEncoding | null;
    /** Return `Dirent` objects instead of names. */
    withFileTypes?: boolean;
    /** Descend into subdirectories. */
    recursive?: boolean;
  }

  /** Options for `mkdirSync` / `mkdir`. */
  interface MkdirOptions {
    /** Create missing parent directories. Defaults to `false`. */
    recursive?: boolean;
    /** The mode of the created directory. */
    mode?: number;
  }

  /** Options for `rmSync` / `rm`. */
  interface RmOptions {
    /** Remove directories and their contents. */
    recursive?: boolean;
    /** Ignore a missing path instead of throwing. */
    force?: boolean;
    /** How often to retry on a busy file. */
    maxRetries?: number;
    /** How long to wait between retries, in milliseconds. */
    retryDelay?: number;
  }

  /** Options for `writeFileSync` / `writeFile`. */
  interface WriteFileOptions {
    /** The encoding used when the data is a string. */
    encoding?: FileEncoding;
    /** The mode of the created file. */
    mode?: number;
    /** The flag used to open the file. */
    flag?: OpenMode;
  }

  /** Options for `readFileSync` / `readFile`. */
  interface ReadFileOptions {
    /** The encoding of the returned contents. */
    encoding?: FileEncoding | null;
    /** The flag used to open the file. */
    flag?: OpenMode;
  }

  /** Options for `statSync` / `stat`. */
  interface StatOptions {
    /** Return `undefined` instead of throwing when the path does not exist. */
    throwIfNoEntry?: boolean;
  }

  /** The pieces a path is made of. */
  interface ParsedPath {
    /** The directory the path lives in. */
    dir: string;
    /** The base name of the path. */
    base: string;
    /** The extension of the base name, including the leading dot. */
    ext: string;
    /** The base name without its extension. */
    name: string;
  }
}

declare module "bun:fs" {
  export type FileEncoding = BunModules.FileEncoding;
  export type PathLike = BunModules.PathLike;
  export type OpenMode = BunModules.OpenMode;
  export type Stats = BunModules.Stats;
  export type Dirent = BunModules.Dirent;
  export type ReaddirOptions = BunModules.ReaddirOptions;
  export type MkdirOptions = BunModules.MkdirOptions;
  export type RmOptions = BunModules.RmOptions;
  export type WriteFileOptions = BunModules.WriteFileOptions;
  export type ReadFileOptions = BunModules.ReadFileOptions;
  export type StatOptions = BunModules.StatOptions;

  /** Close a file descriptor. */
  export function closeSync(fd: number): void;

  /** True when the path exists and is accessible. */
  export function existsSync(path: PathLike): boolean;

  /** Open a file and return its descriptor. */
  export function openSync(path: PathLike, flags: OpenMode, mode?: number): number;

  /** Read from a file descriptor into a buffer. Returns the bytes read. */
  export function readSync(
    fd: number,
    buffer: Uint8Array,
    offset?: number | null,
    length?: number | null,
    position?: number | null,
  ): number;

  /** Write a buffer to a file descriptor. Returns the bytes written. */
  export function writeSync(
    fd: number,
    buffer: Uint8Array,
    offset?: number | null,
    length?: number | null,
    position?: number | null,
  ): number;

  /** Flush a file descriptor's writes to storage. */
  export function fsyncSync(fd: number): void;

  /** Read a whole file. Returns bytes unless an encoding is requested. */
  export function readFileSync(
    path: PathLike,
    options?: { encoding?: null; flag?: OpenMode } | null,
  ): Uint8Array;
  export function readFileSync(
    path: PathLike,
    options: { encoding: FileEncoding; flag?: OpenMode } | FileEncoding,
  ): string;

  /** Write data to a file, replacing it if it exists. */
  export function writeFileSync(
    path: PathLike,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): void;

  /** Append data to a file. */
  export function appendFileSync(
    path: PathLike,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): void;

  /** List a directory. */
  export function readdirSync(
    path: PathLike,
    options: ReaddirOptions & { withFileTypes: true },
  ): Dirent[];
  export function readdirSync(path: PathLike, options?: ReaddirOptions): string[];

  /** Create a directory. Returns the first path created, if any. */
  export function mkdirSync(path: PathLike, options?: MkdirOptions): string | undefined;

  /** Remove a directory. */
  export function rmdirSync(path: PathLike, options?: { recursive?: boolean }): void;

  /** Remove a file or directory tree. */
  export function rmSync(path: PathLike, options?: RmOptions): void;

  /** Remove a file. */
  export function unlinkSync(path: PathLike): void;

  /** Rename a file or directory. */
  export function renameSync(oldPath: PathLike, newPath: PathLike): void;

  /** Copy a file. */
  export function copyFileSync(src: PathLike, dest: PathLike, mode?: number): void;

  /** Create a symbolic link. */
  export function symlinkSync(
    target: PathLike,
    path: PathLike,
    type?: "file" | "dir" | "junction",
  ): void;

  /** Change a path's permissions. */
  export function chmodSync(path: PathLike, mode: number): void;

  /** Change a path's access and modification times. */
  export function utimesSync(path: PathLike, atime: number | Date, mtime: number | Date): void;

  /** Read metadata for a path, following symbolic links. */
  export function statSync(path: PathLike, options?: StatOptions): Stats;

  /** Read metadata for a path without following symbolic links. */
  export function lstatSync(path: PathLike, options?: StatOptions): Stats;

  /** Read metadata for an open file descriptor. */
  export function fstatSync(fd: number, options?: StatOptions): Stats;

  /** Resolve a path to its canonical form, resolving symbolic links. */
  export function realpathSync(path: PathLike): string;

  /** The target of a symbolic link, as stored — not resolved. */
  export function readlinkSync(path: PathLike): string;

  /** Create a unique directory whose name starts with `prefix`. */
  export function mkdtempSync(prefix: string): string;

  /** Check that a path is accessible. */
  export function accessSync(path: PathLike, mode?: number): void;
}

declare module "bun:fs/promises" {
  export type FileEncoding = BunModules.FileEncoding;
  export type PathLike = BunModules.PathLike;
  export type OpenMode = BunModules.OpenMode;
  export type Stats = BunModules.Stats;
  export type Dirent = BunModules.Dirent;
  export type ReaddirOptions = BunModules.ReaddirOptions;
  export type MkdirOptions = BunModules.MkdirOptions;
  export type RmOptions = BunModules.RmOptions;
  export type WriteFileOptions = BunModules.WriteFileOptions;
  export type ReadFileOptions = BunModules.ReadFileOptions;
  export type StatOptions = BunModules.StatOptions;

  /** List a directory. */
  export function readdir(
    path: PathLike,
    options: ReaddirOptions & { withFileTypes: true },
  ): Promise<Dirent[]>;
  export function readdir(path: PathLike, options?: ReaddirOptions): Promise<string[]>;

  /** Read a whole file. Returns bytes unless an encoding is requested. */
  export function readFile(
    path: PathLike,
    options?: { encoding?: null; flag?: OpenMode } | null,
  ): Promise<Uint8Array>;
  export function readFile(
    path: PathLike,
    options: { encoding: FileEncoding; flag?: OpenMode } | FileEncoding,
  ): Promise<string>;

  /** Write data to a file, replacing it if it exists. */
  export function writeFile(
    path: PathLike,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): Promise<void>;

  /** Append data to a file. */
  export function appendFile(
    path: PathLike,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): Promise<void>;

  /** Create a directory. */
  export function mkdir(path: PathLike, options?: MkdirOptions): Promise<string | undefined>;

  /** Remove a directory. */
  export function rmdir(path: PathLike, options?: { recursive?: boolean }): Promise<void>;

  /** Remove a file or directory tree. */
  export function rm(path: PathLike, options?: RmOptions): Promise<void>;

  /** Remove a file. */
  export function unlink(path: PathLike): Promise<void>;

  /** Rename a file or directory. */
  export function rename(oldPath: PathLike, newPath: PathLike): Promise<void>;

  /** Copy a file. */
  export function copyFile(src: PathLike, dest: PathLike): Promise<void>;

  /** Read metadata for a path, following symbolic links. */
  export function stat(path: PathLike, options?: StatOptions): Promise<Stats>;

  /** Read metadata for a path without following symbolic links. */
  export function lstat(path: PathLike, options?: StatOptions): Promise<Stats>;

  /** Resolve a path to its canonical form, resolving symbolic links. */
  export function realpath(path: PathLike): Promise<string>;

  /** Check that a path is accessible. */
  export function access(path: PathLike, mode?: number): Promise<void>;
}

declare module "bun:path" {
  export type ParsedPath = BunModules.ParsedPath;

  /** Join path segments, inserting a separator between each one. */
  export function join(...paths: string[]): string;

  /** Resolve path segments into an absolute path. */
  export function resolve(...paths: string[]): string;

  /** The directory portion of a path. */
  export function dirname(path: string): string;

  /** The last portion of a path, optionally without an extension. */
  export function basename(path: string, ext?: string): string;

  /** The extension of a path, including the leading dot. */
  export function extname(path: string): string;

  /** The relative path from `from` to `to`. */
  export function relative(from: string, to: string): string;

  /** True when the path is absolute. */
  export function isAbsolute(path: string): boolean;

  /** Normalize a path, resolving `.` and `..` segments. */
  export function normalize(path: string): string;

  /** Split a path into its components. */
  export function parse(path: string): ParsedPath;

  /** Build a path from its components. */
  export function format(path: ParsedPath): string;

  /** The platform's path separator. */
  export const sep: string;

  /** The platform's path-list separator. */
  export const delimiter: string;
}

declare module "bun:path/posix" {
  export type ParsedPath = BunModules.ParsedPath;

  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function relative(from: string, to: string): string;
  export function isAbsolute(path: string): boolean;
  export function normalize(path: string): string;
  export function parse(path: string): ParsedPath;
  export function format(path: ParsedPath): string;
  export const sep: string;
  export const delimiter: string;
}

declare module "bun:path/win32" {
  export type ParsedPath = BunModules.ParsedPath;

  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function relative(from: string, to: string): string;
  export function isAbsolute(path: string): boolean;
  export function normalize(path: string): string;
  export function parse(path: string): ParsedPath;
  export function format(path: ParsedPath): string;
  export const sep: string;
  export const delimiter: string;
}
