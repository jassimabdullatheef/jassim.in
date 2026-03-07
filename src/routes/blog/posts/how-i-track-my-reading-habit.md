---
title: "How I keep track of my reading habit and sync it to this site"
date: 2026-03-07
excerpt: Goodreads exports, a Jupyter notebook, and just enough automation to feel productive.
category: Tech
---

I've been on Goodreads since 2016 and I've been doing their annual reading challenge every year since. Some years I smash the goal, some years I quietly lower the target mid-year and pretend that was always the plan.

Goodreads is genuinely great for discovering books — the recommendations, the shelves, the reviews. It's my go-to for figuring out what to read next. But the moment you want to actually *do something* with your data, it reveals its true colours.

## How the library page works

Before getting into the sync flow, here's the basic architecture: all my book data lives as a CSV file (`books-db.csv`) that's checked into this site's repo alongside the code. When the site builds, SvelteKit's server-side `load` function reads that file, parses it, and hands the data to the frontend to render the [library page](/library).

Vite's `import.meta.glob` pulls the CSV in at build time:

```js
const csvModules = import.meta.glob("/src/routes/library/books-db.csv", {
  eager: true,
  as: "raw",
});
```

Then a custom CSV parser handles the file — including quoted fields with commas inside them, which the built-in stuff tends to fumble:

```js
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}
```

The `load` function ties it together — parses the CSV, matches book covers from locally downloaded images, sorts by date read, and returns it all to the page:

```js
export async function load() {
  const coverMap = await loadBookCovers();
  const csvText = csvModules["/src/routes/library/books-db.csv"];
  const books = parseCSV(csvText);
  const organizedBooks = organizeBooksByDate(books, coverMap);

  return {
    allBooks: organizedBooks.filter(book => !book.isToRead),
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
```

So the "database" is just a CSV in the repo. No server, no database connection, no API at runtime. Keeping it simple.

## The API situation

Now, how does the CSV get populated? Ideally, Goodreads would have a working API. It did — *had*. They deprecated it in 2020 and now getting your own data out of the platform requires jumping through hoops that would make a circus trainer proud. OAuth flows that don't work, endpoints that return nothing, documentation that links to pages that no longer exist.

So I did what any reasonable person would do: I gave up on the API entirely and just download the CSV manually.

```
Goodreads → My Books → Tools → Import & Export → Export Library → Download now
```

Yes, manually. Every time. It takes about 10 seconds and it just works. Sometimes the unglamorous solution is the right one.

## The sync script

Once I have the fresh export, I run a Jupyter notebook that does all the heavy lifting. It loads the Goodreads export alongside the existing `books-db.csv`:

```python
book_file = "./src/routes/library/goodreads_library_export.csv"
df = pd.read_csv(book_file)
prev_df = pd.read_csv("./src/routes/library/books-db.csv")
```

Then for each book, it goes looking for a cover image URL. The logic checks the previous database first — no point re-fetching what's already there. If the book is new, it hits the [Longitood book cover API](https://bookcover.longitood.com) using the ISBN:

```python
def get_cover_url(row):
    if pd.notna(row.get("cover_url", pd.NA)):
        return row["cover_url"]

    prev_df_row = prev_df[prev_df["Book Id"] == row["Book Id"]]
    if not prev_df_row.empty:
        return prev_df_row.iloc[0]["cover_url"]

    if pd.notna(row.get("ISBN", pd.NA)):
        return fetch_cover_url_by_isbn(row["ISBN"])
    return None
```

## Downloading the covers

Once we have the cover URLs, the script downloads the actual images locally. The one thing I was particular about: don't re-download what already exists. An image that's already on disk should be left alone — unless it's smaller than 1KB, which usually means something went wrong the last time.

```python
need_download = (
    not os.path.isfile(output_path) or
    (os.path.isfile(output_path) and os.path.getsize(output_path) < 1024)
)
```

Images get saved to `src/lib/images/book-cover/` using the ISBN as the filename. The relative path gets written back into the dataframe so the server code knows how to match them up.

## Writing it all back

Last step — save everything back to the CSV:

```python
df.to_csv("src/routes/library/books-db.csv", index=False)
```

That's the file the site reads from. Commit, push, deploy — and the library page reflects everything.

## The full picture

So the whole flow is:

1. Export CSV from Goodreads
2. Run the notebook — it fetches cover URLs, downloads images, updates the CSV
3. Commit and deploy
4. SvelteKit reads the CSV at build time and renders the library page

It's not a real-time sync. There's no cron job, no webhook, no live connection to Goodreads. It's me, a terminal, and a notebook I run whenever I feel like updating the list. Which honestly suits me fine — reading is a slow, deliberate habit, and the sync process being manual fits that energy.

---

If you want to do something similar, the full flow is surprisingly simple. The hardest part was accepting that the Goodreads API wasn't going to cooperate and just moving on.
