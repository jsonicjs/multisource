/* Copyright (c) 2025 Richard Rodger, MIT License */

package multisource

import (
	"fmt"

	directive "github.com/jsonicjs/directive/go"
	jsonic "github.com/jsonicjs/jsonic/go"
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

	cfg := j.Config()

	// Add the mark character to ender chars so built-in matchers stop there.
	if cfg.EnderChars == nil {
		cfg.EnderChars = make(map[rune]bool)
	}
	cfg.EnderChars[rune(markChar[0])] = true

	// Define a directive that can load content from multiple sources.
	dopts := directive.DirectiveOptions{
		Name: "multisource",
		Open: markChar,
		Rules: &directive.RulesOption{
			Open: map[string]*directive.RuleMod{
				"val": {},
				"pair": {
					C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
						return r.Lte("pk", 0)
					},
				},
			},
		},
		Action: func(rule *jsonic.Rule, ctx *jsonic.Context) {
			spec := rule.Child.Node

			var pathStr string
			switch v := spec.(type) {
			case string:
				pathStr = v
			case map[string]any:
				if p, ok := v["path"]; ok {
					pathStr = fmt.Sprintf("%v", p)
				}
			}

			res := resolveSource(pathStr, opts, j)

			from := ""
			if rule.Parent != nil && rule.Parent != jsonic.NoRule {
				from = rule.Parent.Name
			}

			// Handle the {@foo} case, injecting keys into parent map.
			if from == "pair" {
				if m, ok := res.(map[string]any); ok {
					if rule.Parent.Parent != nil && rule.Parent.Parent != jsonic.NoRule {
						if parent, ok := rule.Parent.Parent.Node.(map[string]any); ok {
							for k, v := range m {
								parent[k] = v
							}
						}
					}
				}
			} else {
				rule.Node = res
			}
		},
		Custom: func(j *jsonic.Jsonic, cfg directive.DirectiveConfig) {
			OPEN := cfg.OPEN
			name := cfg.Name

			// Handle special case of @foo first token - assume a map.
			j.Rule("val", func(rs *jsonic.RuleSpec) {
				rs.PrependOpen(
					&jsonic.AltSpec{
						S: [][]jsonic.Tin{{OPEN}},
						C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
							return r.N["pk"] > 0
						},
						B: 1,
						G: name + "_undive",
					},
					&jsonic.AltSpec{
						S: [][]jsonic.Tin{{OPEN}},
						C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
							return r.D == 0
						},
						P: "map",
						B: 1,
						N: map[string]int{name + "_top": 1},
					},
				)
			})

			j.Rule("map", func(rs *jsonic.RuleSpec) {
				rs.PrependOpen(&jsonic.AltSpec{
					S: [][]jsonic.Tin{{OPEN}},
					C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
						return r.D == 1 && r.N[name+"_top"] == 1
					},
					P: "pair",
					B: 1,
				})
				rs.PrependClose(&jsonic.AltSpec{
					S: [][]jsonic.Tin{{OPEN}},
					C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
						return r.N["pk"] > 0
					},
					B: 1,
					G: name + "_undive",
				})
			})

			j.Rule("pair", func(rs *jsonic.RuleSpec) {
				rs.PrependClose(&jsonic.AltSpec{
					S: [][]jsonic.Tin{{OPEN}},
					C: func(r *jsonic.Rule, ctx *jsonic.Context) bool {
						return r.N["pk"] > 0
					},
					B: 1,
					G: name + "_undive",
				})
			})
		},
	}

	directive.Apply(j, dopts)
}

// resolveSource resolves a multisource path and returns the processed value.
func resolveSource(pathStr string, opts *MultiSourceOptions, j *jsonic.Jsonic) any {
	spec := ResolvePathSpec(pathStr, opts.Path)
	res := opts.Resolver(spec, opts)

	if !res.Found {
		return nil
	}

	proc := getProcessor(res.Kind, opts.Processor)
	proc(&res, opts, j)

	return res.Val
}
