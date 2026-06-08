/* Copyright (c) 2021-2025 Richard Rodger and other contributors, MIT License */

package multisource

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// FileResolverOptions configures MakeFileResolver.
type FileResolverOptions struct {
	// PathFinder transforms the raw reference path before resolution.
	PathFinder func(spec string) string
	// Preload maps full paths to content, consulted before reading from disk.
	Preload map[string]string
}

// MakeFileResolver creates a resolver that loads sources from the filesystem.
//
// It mirrors the TypeScript makeFileResolver: the reference is resolved to an
// absolute path; when the path has no extension, implicit extensions and index
// files are tried; and a preload map (full path -> content) is consulted before
// touching disk.
func MakeFileResolver(opts ...FileResolverOptions) Resolver {
	var o FileResolverOptions
	if len(opts) > 0 {
		o = opts[0]
	}

	return func(spec PathSpec, mopts *MultiSourceOptions) Resolution {
		// A pathfinder transforms the raw reference before resolution.
		if o.PathFinder != nil {
			spec = ResolvePathSpec(o.PathFinder(spec.Path), spec.Base)
		}

		res := Resolution{PathSpec: spec, Found: false}
		if spec.Full == "" {
			return res
		}

		full := spec.Full
		if abs, err := filepath.Abs(full); err == nil {
			full = abs
		}
		res.Full = full

		potentials := buildPotentials(full, mopts.ImplicitExt)
		res.Search = potentials

		for _, p := range potentials {
			if src, ok := o.Preload[p]; ok {
				res.Full = p
				res.Kind = extKind(p)
				res.Src = src
				res.Found = true
				return res
			}
			if src, ok := loadFile(p); ok {
				res.Full = p
				res.Kind = extKind(p)
				res.Src = src
				res.Found = true
				return res
			}
		}

		return res
	}
}

// PkgResolverOptions configures MakePkgResolver.
type PkgResolverOptions struct {
	// Paths lists directories whose node_modules folders are searched; each is
	// also walked upwards. When empty, the resolver walks up from the current
	// working directory.
	Paths []string
}

// MakePkgResolver creates a resolver that resolves references inside
// node_modules folders, mirroring the TypeScript makePkgResolver.
//
// Go has no equivalent of Node's require.resolve, so this implements the
// portable subset: it walks node_modules directories, honours a package's
// package.json "main" for bare references, and tries implicit extensions and
// index files. It does not implement Node's full module-resolution algorithm
// (for example, conditional "exports").
func MakePkgResolver(opts ...PkgResolverOptions) Resolver {
	var o PkgResolverOptions
	if len(opts) > 0 {
		o = opts[0]
	}

	return func(spec PathSpec, mopts *MultiSourceOptions) Resolution {
		res := Resolution{PathSpec: spec, Found: false}
		ref := spec.Path
		if ref == "" {
			return res
		}

		var roots []string
		if len(o.Paths) > 0 {
			roots = o.Paths
		} else if cwd, err := os.Getwd(); err == nil {
			roots = []string{cwd}
		}

		seen := map[string]bool{}
		var search []string

		for _, root := range roots {
			for _, dir := range ancestorDirs(root) {
				nm := filepath.Join(dir, "node_modules")
				if seen[nm] {
					continue
				}
				seen[nm] = true

				if full, src, ok := resolveInPkgDir(nm, ref, mopts.ImplicitExt, &search); ok {
					res.Full = full
					res.Kind = extKind(full)
					res.Src = src
					res.Found = true
					res.Search = search
					return res
				}
			}
		}

		res.Search = search
		return res
	}
}

// resolveInPkgDir resolves a package reference inside a node_modules directory,
// trying the reference directly (with implicit extensions and index files) and
// then the target package's package.json "main".
func resolveInPkgDir(nodeModules, ref string, exts []string, search *[]string) (full, src string, found bool) {
	target := filepath.Join(nodeModules, filepath.FromSlash(ref))

	for _, p := range buildPotentials(target, exts) {
		*search = append(*search, p)
		if s, ok := loadFile(p); ok {
			return p, s, true
		}
	}

	// Bare package reference: honour package.json "main".
	pkgJSON := filepath.Join(target, "package.json")
	*search = append(*search, pkgJSON)
	if data, err := os.ReadFile(pkgJSON); err == nil {
		var meta struct {
			Main string `json:"main"`
		}
		if json.Unmarshal(data, &meta) == nil && meta.Main != "" {
			mainPath := filepath.Join(target, filepath.FromSlash(meta.Main))
			for _, p := range buildPotentials(mainPath, exts) {
				*search = append(*search, p)
				if s, ok := loadFile(p); ok {
					return p, s, true
				}
			}
		}
	}

	return "", "", false
}

// loadFile reads a file, reporting whether it was read successfully. A failed
// read is treated as the source not existing.
func loadFile(p string) (string, bool) {
	b, err := os.ReadFile(p)
	if err != nil {
		return "", false
	}
	return string(b), true
}

// ancestorDirs returns dir followed by each of its parent directories.
func ancestorDirs(dir string) []string {
	if dir == "" {
		return nil
	}
	var dirs []string
	for {
		dirs = append(dirs, dir)
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return dirs
}
