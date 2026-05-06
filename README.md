# tejasbansal1.github.io

This repository hosts the static files for [tejasbansal1.github.io](https://tejasbansal1.github.io/). It contains HTML pages, images and the compiled styles.

## Serving the site locally

You can use any static file server. For example, with Python installed run:

```bash
python3 -m http.server
```

Then open <http://localhost:8000> in your browser to view the site.

## Tailwind CSS

`src/output.css` is the generated Tailwind CSS used by the pages. If you edit `src/input.css`, recompile the stylesheet with:

```bash
npx tailwindcss -i src/input.css -o src/output.css --watch
```

This watches for changes and regenerates `output.css` automatically.
