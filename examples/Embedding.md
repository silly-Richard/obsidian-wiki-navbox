---
tags:
  - example
---

# Embedding a navbox

This page embeds the “Navigation” section from the fruit example instead of copying the YAML:

![[Fruit#Navigation]]

## Three forms

- `[[Fruit#Navigation]]`: a normal link to the source note.
- `![[Fruit#Navigation]]`: render that heading and its content in this page.
- `![[Fruit]]`: embed the whole source note.

## Recommendation

1. Put the navbox under a heading such as `## Navigation` in the topic page.
2. Embed that heading from other notes.
3. Edit the source note once; every embed updates automatically.

> [!note] Header actions
> Embedded content uses the **source note** as its context. Edit opens the source note, and internal links resolve relative to it. “Talk” is hidden by default; enable it in settings or with `links.talk: true`.
