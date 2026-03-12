/* Copyright (c) 2025 Richard Rodger, MIT License */

package multisource

import (
	"strings"

	jsonic "github.com/jsonicjs/jsonic/go"
)

// lexMode tracks which kind of token the custom matchers should produce.
type lexMode int

const (
	modeNormal lexMode = iota // Normal jsonic parsing.
	modePath                  // Scanning a multisource path after @.
)

// MultiSource is a jsonic plugin that adds multisource reference support.
// When '@path' is encountered in the input, the path is resolved using
// the configured resolver and processed into a value.
func MultiSource(j *jsonic.Jsonic, pluginOpts map[string]any) {
	opts := getOpts(pluginOpts)
	markChar := opts.MarkChar
	if markChar == "" {
		markChar = "@"
	}
	markByte := markChar[0]

	mode := modeNormal

	cfg := j.Config()

	// Register the mark character as a fixed token.
	AT := j.Token("#AT", markChar)
	cfg.SortFixedTokens()

	// Register custom token type for multisource paths.
	MP := j.Token("#MP")

	// Standard tokens.
	ZZ := j.Token("#ZZ")
	OB := j.Token("#OB") // {
	CB := j.Token("#CB") // }
	CL := j.Token("#CL") // :
	CA := j.Token("#CA") // ,
	_ = ZZ
	_ = OB
	_ = CB
	_ = CL
	_ = CA

	// Add the mark character to ender chars so built-in matchers stop there.
	if cfg.EnderChars == nil {
		cfg.EnderChars = make(map[rune]bool)
	}
	cfg.EnderChars[rune(markByte)] = true

	// Path matcher: reads the path after @.
	// Runs at priority < 2e6 so it executes before built-in matchers.
	j.AddMatcher("msrcpath", 100000, func(lex *jsonic.Lex) *jsonic.Token {
		if mode != modePath {
			return nil
		}
		mode = modeNormal

		pnt := lex.Cursor()
		src := lex.Src
		sI := pnt.SI
		cI := pnt.CI

		if sI >= pnt.Len {
			return nil
		}

		// Skip leading whitespace.
		for sI < pnt.Len && (src[sI] == ' ' || src[sI] == '\t') {
			sI++
			cI++
		}

		ch := src[sI]
		// Don't match at delimiters or quotes.
		if ch == ',' || ch == '}' || ch == ']' || ch == '{' || ch == '[' ||
			ch == '\n' || ch == '\r' || ch == markByte {
			return nil
		}

		// Handle quoted paths: "path" or 'path'.
		if ch == '"' || ch == '\'' {
			quote := ch
			sI++ // skip opening quote
			cI++
			startI := sI
			for sI < pnt.Len && src[sI] != quote {
				if src[sI] == '\\' && sI+1 < pnt.Len {
					sI += 2
					cI += 2
					continue
				}
				sI++
				cI++
			}
			pathStr := src[startI:sI]
			raw := src[pnt.SI:sI]
			if sI < pnt.Len {
				sI++ // skip closing quote
				cI++
				raw = src[pnt.SI:sI]
			}
			tkn := lex.Token("#MP", MP, pathStr, raw)
			pnt.SI = sI
			pnt.CI = cI
			return tkn
		}

		startI := sI

		// Read path until a delimiter.
		for sI < pnt.Len {
			c := src[sI]
			if c == ' ' || c == '\t' || c == '\n' || c == '\r' ||
				c == ',' || c == '}' || c == ']' || c == ':' ||
				c == '{' || c == '[' || c == markByte {
				break
			}
			sI++
			cI++
		}

		if sI == startI {
			return nil
		}

		raw := src[startI:sI]
		pathStr := strings.TrimSpace(raw)

		tkn := lex.Token("#MP", MP, pathStr, raw)
		pnt.SI = sI
		pnt.CI = cI
		return tkn
	})

	// resolveSource resolves a multisource path and sets the node value.
	resolveSource := func(pathStr string) any {
		spec := ResolvePathSpec(pathStr, opts.Path)
		res := opts.Resolver(spec, opts)

		if !res.Found {
			return nil
		}

		proc := getProcessor(res.Kind, opts.Processor)
		proc(&res, opts, j)

		return res.Val
	}

	// Extend the val rule to handle @path in value position.
	j.Rule("val", func(rs *jsonic.RuleSpec) {
		newAlts := []*jsonic.AltSpec{
			// @path in value position: resolve and use as value.
			{
				S: [][]jsonic.Tin{{AT}},
				P: "msrc",
				A: func(r *jsonic.Rule, ctx *jsonic.Context) {
					mode = modePath
				},
			},
		}
		rs.Open = append(newAlts, rs.Open...)
	})

	// Extend the pair rule to handle @path in pair position (merge into map).
	j.Rule("pair", func(rs *jsonic.RuleSpec) {
		newAlts := []*jsonic.AltSpec{
			{
				S: [][]jsonic.Tin{{AT}},
				P: "msrc",
				U: map[string]any{"msrc_merge": true},
				A: func(r *jsonic.Rule, ctx *jsonic.Context) {
					mode = modePath
				},
			},
		}
		rs.Open = append(newAlts, rs.Open...)
	})

	// The msrc rule handles resolving the multisource path.
	j.Rule("msrc", func(rs *jsonic.RuleSpec) {
		rs.Clear()

		rs.Open = []*jsonic.AltSpec{
			{
				S: [][]jsonic.Tin{{MP}},
				A: func(r *jsonic.Rule, ctx *jsonic.Context) {
					pathStr, _ := r.O0.Val.(string)
					if pathStr == "" {
						pathStr = r.O0.Src
					}

					val := resolveSource(pathStr)
					r.Node = val

					// If parent requested merge, merge the resolved map.
					if r.Parent != nil && r.Parent != jsonic.NoRule {
						if _, doMerge := r.Parent.U["msrc_merge"]; doMerge {
							if m, ok := val.(map[string]any); ok {
								if parent, ok := r.Parent.Node.(map[string]any); ok {
									for k, v := range m {
										parent[k] = v
									}
								}
							}
						}
					}
				},
			},
		}
	})
}
