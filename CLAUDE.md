# CLAUDE.md

Guidance for working in this repository.

## What this is

`@jsonic/multisource` is a [Jsonic](https://jsonic.senecajs.org) plugin that
loads partial values from external sources (files, packages, in-memory maps)
into a single parse result. A directive character (`@` by default) marks a
reference; the plugin resolves it, processes the resolved text, and splices
the result into the parse output.

The repository ships **two implementations**:

- **TypeScript** — `src/`, tests in `test/`, built to `dist/` + `dist-test/`.
- **Go** — `go/`, a port published as the `github.com/jsonicjs/multisource/go`
  module.

## TypeScript is canonical

**The TypeScript implementation is the source of truth.** The Go package is a
port that follows TS semantics. When the two diverge, **TS wins** — change Go
to match TS, not the other way around (unless you are deliberately fixing a
bug in TS first, then porting the fix).

When adding or changing behaviour:

1. Implement and test it in TypeScript first.
2. Port the change to Go, mirroring the public API names and behaviour as
   closely as the language allows.
3. Keep both test suites and both `doc/` files in sync.

## Build & test

Use the `Makefile` targets (they wrap npm and go):

```sh
make build      # build-ts + build-go
make test       # test-ts + test-go
make build-ts   # npm run build   (tsc --build src test)
make test-ts    # npm test        (node --test dist-test/*.test.js)
make build-go   # cd go && go build ./...
make test-go    # cd go && go test ./...
```

Notes:

- TS tests run against the **built** output in `dist-test/`, so run
  `make build-ts` (or `npm run build`) before `make test-ts`.
- `npm run reset` does a clean reinstall + build + test.
- Go has no external runtime deps beyond the other `jsonicjs/*/go` modules.

## Resolver & processor parity

Resolvers turn a reference into source text; processors turn source text into
a value. The public factory names are kept aligned across the two ports:

| Resolver (TS)        | Resolver (Go)        | Resolves from        |
| -------------------- | -------------------- | -------------------- |
| `makeMemResolver`    | `MakeMemResolver`    | in-memory `map`      |
| `makeFileResolver`   | `MakeFileResolver`   | filesystem           |
| `makePkgResolver`    | `MakePkgResolver`    | `node_modules`       |

| Processor (TS)            | Processor (Go)      | Handles            |
| ------------------------- | ------------------- | ------------------ |
| default (string)          | `DefaultProcessor`  | unknown / raw      |
| `makeJsonicProcessor`     | `JsonicProcessor`   | `.jsonic`, `.jsc`  |
| (json via jsonic)         | `JSONProcessor`     | `.json`            |
| `makeJavaScriptProcessor` | — (Node-only)       | `.js`              |

## Known Go ↔ TS differences

The ports are not line-for-line identical. Current intentional/known gaps:

- **`MakePkgResolver` is a portable subset.** Go has no `require.resolve`, so
  the Go resolver walks `node_modules` directories, honours `package.json`
  `"main"` for bare references, and tries implicit extensions / index files.
  It does not implement Node's full module-resolution algorithm (e.g.
  conditional `"exports"`).
- **No virtual filesystem in Go.** The TS resolvers accept a `ctx.meta.fs`
  (used by tests via `memfs`); the Go resolvers use the OS filesystem
  directly.
- **No `.js` processor in Go.** Executing JavaScript modules is Node-specific.
- **Base-path resolution.** The Go plugin resolves a reference against
  `opts.Path` once, before calling the resolver; it does not yet track each
  parent file's directory for relative nested includes the way the TS
  `resolvePathSpec` does via `ctx.meta.multisource.path`.

If you close any of these gaps, update this list and both `doc/` files.

## Releasing the Go module

The Go module is versioned independently (see `const Version` in
`go/multisource.go`) and tagged `go/vX.Y.Z`. Use `make publish-go V=x.y.z`.
Do not bump or tag a release unless explicitly asked.
