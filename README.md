# Flow

Flow gives an agent a visible path through a task.

Instead of hiding steps, decisions, and waits inside a long prompt, Flow writes
them as a small flowchart you can read from top to bottom.

Start with [Why Flow exists](docs/flow-language.md), then build your first
workflow in the [quick start](docs/quick-start.md).

The [Flow extension](extensions/flow/README.md) provides highlighting,
indentation, and USE file links in Cursor and VS Code.

## Documentation website

The documentation is published at
[flow.vinodliyanage.me](https://flow.vinodliyanage.me) and built with VitePress
from the Markdown files in `docs/`.

```sh
npm install
npm run docs:dev
```

Run `npm run docs:build` to create the production site. The GitHub Pages
workflow publishes that build from `main`.
