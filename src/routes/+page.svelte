<script>
  import { onMount, afterUpdate } from "svelte";
  import { browser } from "$app/environment";
  import jassimImage from "$lib/images/jassim.jpg";
  import FloatingWindow from "$lib/components/FloatingWindow.svelte";

  export let data;

  const MUSIC_EMBED_URL =
    "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1867187148&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=false&show_reposts=false&show_teaser=true";
  const LIBRARY_PAGE_SIZE = 16;

  const THEMES = {
    green: { bg: "#070c08", bg2: "#0c130d", fg: "#9fe8b2", dim: "#4e7a5c", accent: "#3dd97a", accent2: "#b7ffd0", border: "#1b2e20", link: "#7de8a4", swatch: "#3dd97a" },
    amber: { bg: "#0d0904", bg2: "#141008", fg: "#f0c88a", dim: "#8a6a3a", accent: "#ffb32e", accent2: "#ffd98a", border: "#2b2010", link: "#ffc35c", swatch: "#ffb32e" },
    dracula: { bg: "#1e1f29", bg2: "#282a36", fg: "#f8f8f2", dim: "#6272a4", accent: "#bd93f9", accent2: "#ff79c6", border: "#3a3d4d", link: "#8be9fd", swatch: "#bd93f9" },
    "solar-dark": { bg: "#00212b", bg2: "#002b36", fg: "#93a1a1", dim: "#586e75", accent: "#268bd2", accent2: "#2aa198", border: "#0a3642", link: "#268bd2", swatch: "#268bd2" },
    "solar-light": { bg: "#fdf6e3", bg2: "#f4ecd7", fg: "#586e75", dim: "#93a1a1", accent: "#b58900", accent2: "#cb4b16", border: "#e5dcc3", link: "#268bd2", swatch: "#b58900" },
    nord: { bg: "#242933", bg2: "#2e3440", fg: "#d8dee9", dim: "#616e88", accent: "#88c0d0", accent2: "#a3be8c", border: "#3b4252", link: "#81a1c1", swatch: "#88c0d0" },
  };

  const BOOT_LINES = [
    "JSM/OS BIOS v3.0 — (c) jsm.sh",
    "Detecting curiosity............... OK",
    "Mounting ~/projects .............. OK",
    "Mounting ~/blog .................. OK",
    "Loading personality drivers ...... OK",
    "Starting jsh 1.0 ................. OK",
    "",
    "login: guest",
    "Welcome back.",
  ];

  const COMMANDS = ["help", "home", "about", "projects", "blog", "open", "library", "music", "photos", "theme", "themes", "clear", "whoami", "contact", "neofetch", "cowsay", "sudo", "ls"];

  const PROJECTS = [
    { name: "timeblocker/", desc: "Plan your day by dragging tasks onto a timeline. Set durations, build your schedule visually.", href: "/projects/timeblocker" },
    { name: "scale_pro/", desc: "Learn and practice scales & modes. Ships with a progressive metronome with customizable settings.", href: "/projects/scale_pro" },
  ];

  let theme = null;
  let history = [];
  let inputVal = "";
  let ctxOpen = false, ctxX = 0, ctxY = 0;
  let booting = false, bootN = 0;
  let lastSection = "home";
  let histIdx = -1;
  let cmdLog = [];
  let activeIdx = null;
  let scrollEl, inputEl;
  let pendingScroll = false;
  let bootTimer;
  let sectHint = null;

  let libraryShown = {};
  let photoAlbumSel = {};
  let photoViewer = null;
  let photoWin = { x: 140, y: 90, width: 640, height: 480 };
  let musicWin = { x: 180, y: 110, width: 420, height: 340 };
  let musicPlayerOpen = false;

  function loadMoreBooks(idx, total) {
    const cur = libraryShown[idx] ?? LIBRARY_PAGE_SIZE;
    libraryShown = { ...libraryShown, [idx]: Math.min(cur + LIBRARY_PAGE_SIZE, total) };
  }

  function openAlbum(idx, key) {
    photoAlbumSel = { ...photoAlbumSel, [idx]: key };
  }
  function closeAlbum(idx) {
    photoAlbumSel = { ...photoAlbumSel, [idx]: null };
  }

  function fitWindow(idealWidth, idealHeight) {
    if (!browser) return { x: 0, y: 0, width: idealWidth, height: idealHeight };
    const width = Math.min(idealWidth, window.innerWidth - 16);
    const height = Math.min(idealHeight, window.innerHeight - 56);
    const x = Math.max(4, Math.round((window.innerWidth - width) / 2));
    const y = Math.max(48, Math.round((window.innerHeight - height) / 2));
    return { x, y, width, height };
  }

  function openPhotoViewer(photos, index, label) {
    photoViewer = { photos, index, label };
    photoWin = fitWindow(640, 480);
  }
  function closePhotoViewer() {
    photoViewer = null;
  }
  function nextPhoto() {
    if (!photoViewer) return;
    photoViewer = { ...photoViewer, index: (photoViewer.index + 1) % photoViewer.photos.length };
  }
  function prevPhoto() {
    if (!photoViewer) return;
    photoViewer = { ...photoViewer, index: (photoViewer.index - 1 + photoViewer.photos.length) % photoViewer.photos.length };
  }

  function openMusicPlayer() {
    musicPlayerOpen = true;
    musicWin = fitWindow(420, 340);
  }
  function closeMusicPlayer() {
    musicPlayerOpen = false;
  }

  $: tid = theme ?? "green";
  $: th = THEMES[tid] || THEMES.green;

  function fmtDate(d) {
    if (!d) return "";
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const p = d.split("-");
    return m[+p[1] - 1] + " " + p[2] + ", " + p[0];
  }

  function cowsay(text) {
    const t = text || "moo";
    const w = t.length;
    return " " + "_".repeat(w + 2) + "\n< " + t + " >\n " + "-".repeat(w + 2) + "\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||";
  }

  function makeEntry(cmdStr) {
    const parts = cmdStr.trim().split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();
    const arg = parts.slice(1).join(" ");
    const e = { cmd: cmdStr };
    const TITLES = { about: "About", whoami: "About", projects: "Projects", work: "Projects", blog: "Blog", posts: "Blog", library: "Library", books: "Library", music: "Music", photos: "Photography", photography: "Photography" };
    if (TITLES[cmd]) e.title = TITLES[cmd];
    const dimL = (t) => ({ text: t, color: th.dim });
    const fgL = (t) => ({ text: t, color: th.fg });
    const accL = (t) => ({ text: t, color: th.accent2 });

    sectHint = null;
    switch (cmd) {
      case "./welcome.sh":
      case "home":
      case "cd":
        e.tHome = true;
        e.chips = ["about", "projects", "blog", "library", "music", "photos"];
        sectHint = "home";
        break;
      case "about":
      case "whoami":
        e.tAbout = true;
        sectHint = "about";
        break;
      case "projects":
      case "work":
        e.tProjects = true;
        sectHint = "projects";
        break;
      case "blog":
      case "posts":
        e.tBlog = true;
        e.blogCount = data.posts.length;
        e.posts = data.posts.map((p) => ({ slug: p.slug, title: p.title, date: fmtDate(p.date), tagStr: p.tags.map((t) => "#" + t.toLowerCase()).join(" ") }));
        sectHint = "blog";
        break;
      case "open":
      case "read": {
        const p = data.posts.find((x) => x.slug === arg || x.slug.startsWith(arg));
        if (p) {
          e.tPost = true;
          e.pTitle = p.title;
          e.pDate = fmtDate(p.date);
          e.pTags = p.tags.map((t) => "#" + t.toLowerCase()).join(" ");
          e.pContent = p.content;
          e.pHref = "/blog/" + p.slug;
        } else {
          e.tText = true;
          e.lines = [fgL(`open: post '${arg}' not found — try `), dimL("type 'blog' to list posts")];
        }
        sectHint = "blog";
        break;
      }
      case "library":
      case "books":
        e.tLibrary = true;
        e.libCount = data.books.length;
        e.books = data.books;
        sectHint = "library";
        break;
      case "music":
        e.tMusic = true;
        sectHint = "music";
        openMusicPlayer();
        break;
      case "photos":
      case "photography":
        e.tPhotos = true;
        sectHint = "photos";
        break;
      case "help":
      case "?":
        e.tHelp = true;
        e.helpRows = [
          { cmd: "home", label: "home", desc: "back to the welcome screen" },
          { cmd: "about", label: "about", desc: "who is this guy" },
          { cmd: "projects", label: "projects", desc: "things I built" },
          { cmd: "blog", label: "blog", desc: "list posts (click to read)" },
          { cmd: "library", label: "library", desc: "what I'm reading" },
          { cmd: "music", label: "music", desc: "music production" },
          { cmd: "photos", label: "photos", desc: "photography grid" },
          { cmd: "themes", label: "themes", desc: "list themes · theme <name> to switch" },
          { cmd: "neofetch", label: "neofetch", desc: "system info" },
          { cmd: "contact", label: "contact", desc: "say hi" },
          { cmd: "clear", label: "clear", desc: "wipe the screen" },
        ];
        break;
      case "themes":
        e.tText = true;
        e.lines = [dimL("available themes — click a dot in the title bar, or:")].concat(Object.keys(THEMES).map((k) => fgL("  theme " + k)));
        break;
      case "theme": {
        if (THEMES[arg]) {
          e.tText = true;
          e.lines = [accL("theme set to " + arg)];
          if (browser) try { localStorage.setItem("jsm_theme", arg); } catch (err) {}
          setTimeout(() => { theme = arg; }, 0);
        } else {
          e.tText = true;
          e.lines = [fgL(`theme: unknown theme '${arg}'`), dimL("type 'themes' to list")];
        }
        break;
      }
      case "contact":
      case "email":
        e.tText = true;
        e.lines = [fgL("  mail   hi@jsm.sh"), fgL("  x      @_al_jassim"), fgL("  in     /in/jassimabdullatheef")];
        break;
      case "neofetch":
      case "fetch":
        e.tFetch = true;
        e.art = "     ▄▄▄▄▄▄▄\n   ▄█▀     ▀█▄\n  ██   ▄▄▄   ██\n  ██   ▀▀▀   ██\n   ▀█▄ ▄▄▄ ▄█▀\n     ▀▀▀▀▀▀▀\n    j s m . s h";
        break;
      case "sudo":
        e.tText = true;
        e.lines = [fgL("jassim is not in the sudoers file."), accL("This incident will be reported.")];
        break;
      case "rm":
        e.tText = true;
        e.lines = cmdStr.includes("-rf") && (cmdStr.includes("/") || cmdStr.includes("*"))
          ? [dimL("deleting /usr .......... done"), dimL("deleting /home ......... done"), dimL("deleting /self_esteem .. done"), accL("nice try. restoring from backup... done ✓")]
          : [fgL("rm: refusing to remove anything. This archive is precious.")];
        break;
      case "cowsay":
        e.tCow = true;
        e.cow = cowsay(arg);
        break;
      case "ls":
        e.tText = true;
        e.lines = [{ text: "about.md   projects/   blog/   library/   music/   photography/", color: th.accent }];
        break;
      case "clear":
        break;
      case "":
        break;
      default:
        e.tText = true;
        e.lines = [fgL(`jsh: command not found: ${cmd}`), dimL("type 'help' or click the menu above")];
    }
    return e;
  }

  function run(cmdStr) {
    const c = cmdStr.trim();
    if (!c) return;
    pendingScroll = true;
    const cmd = c.split(/\s+/)[0].toLowerCase();
    if (c === "__skipboot") { finishBoot(); return; }
    if (cmd === "clear") {
      history = [];
      inputVal = "";
      ctxOpen = false;
      cmdLog = [...cmdLog, c];
      histIdx = -1;
      activeIdx = null;
      return;
    }
    const entry = makeEntry(c);
    history = [...history, entry];
    inputVal = "";
    ctxOpen = false;
    cmdLog = [...cmdLog, c];
    histIdx = -1;
    activeIdx = null;
    if (sectHint) lastSection = sectHint;
  }

  function finishBoot() {
    clearInterval(bootTimer);
    if (browser) try { localStorage.setItem("jsm_booted", "1"); } catch (e) {}
    if (booting) booting = false;
    setTimeout(() => { if (inputEl) inputEl.focus(); }, 50);
  }

  function restart() {
    if (browser) try { localStorage.removeItem("jsm_booted"); } catch (e) {}
    clearInterval(bootTimer);
    history = [];
    cmdLog = [];
    histIdx = -1;
    activeIdx = null;
    inputVal = "";
    ctxOpen = false;
    lastSection = "home";
    libraryShown = {};
    photoAlbumSel = {};
    photoViewer = null;
    musicPlayerOpen = false;
    bootN = 0;
    booting = true;
    bootTimer = setInterval(() => {
      if (bootN >= BOOT_LINES.length) { finishBoot(); return; }
      bootN += 1;
    }, 260);
    history = [makeEntry("./welcome.sh")];
  }

  onMount(() => {
    let savedTheme = null;
    try { savedTheme = localStorage.getItem("jsm_theme"); } catch (e) {}
    if (savedTheme && THEMES[savedTheme]) theme = savedTheme;

    let booted = false;
    try { booted = !!localStorage.getItem("jsm_booted"); } catch (e) {}

    if (!booted) {
      booting = true;
      bootTimer = setInterval(() => {
        if (bootN >= BOOT_LINES.length) { finishBoot(); return; }
        bootN += 1;
      }, 260);
    }

    history = [makeEntry("./welcome.sh")];

    const keyHandler = () => { if (booting) finishBoot(); };
    window.addEventListener("keydown", keyHandler);

    return () => {
      clearInterval(bootTimer);
      window.removeEventListener("keydown", keyHandler);
    };
  });

  afterUpdate(() => {
    if (!scrollEl || !pendingScroll) return;
    pendingScroll = false;
    const entries = scrollEl.querySelectorAll("[data-entry]");
    const last = entries[entries.length - 1];
    if (last) scrollEl.scrollTop = last.offsetTop - 16;
    else scrollEl.scrollTop = scrollEl.scrollHeight;
  });

  $: iv = inputVal.trim().toLowerCase();
  $: ghostMatch = iv && !iv.includes(" ") ? COMMANDS.find((c) => c.startsWith(iv) && c !== iv) : null;

  $: menuItems = ["home", "about", "projects", "blog", "library", "music", "photos", "help"].map((m) => ({
    cmd: m,
    label: m,
    fg: m === lastSection ? th.accent2 : th.dim,
    bg: m === lastSection ? th.border : "transparent",
  }));

  $: ctxItems = [
    { isHeader: true, label: "navigate" },
    { isItem: true, cmd: "home", label: "home" },
    { isItem: true, cmd: "help", label: "help" },
    { isItem: true, cmd: "clear", label: "clear terminal" },
    { isHeader: true, label: "theme" },
    ...Object.keys(THEMES).map((k) => ({ isItem: true, cmd: "theme " + k, label: (k === tid ? "● " : "○ ") + k })),
  ];

  $: displayEntries = (() => {
    const active = activeIdx == null ? history.length - 1 : activeIdx;
    return history.map((e, i) => ({ ...e, idx: i, on: i === active }));
  })();

  function activate(i, ev) {
    if (ev.target.closest("[data-cmd]") || ev.target.tagName === "A" || ev.target.closest("img")) return;
    activeIdx = i;
  }

  function exec(e) {
    e.stopPropagation();
    const c = e.currentTarget.getAttribute("data-cmd");
    if (c) run(c);
  }

  function onKey(e) {
    if (e.key === "Enter") { run(inputVal); }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (ghostMatch) inputVal = ghostMatch + " ";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = histIdx < 0 ? cmdLog.length - 1 : Math.max(0, histIdx - 1);
      if (cmdLog.length) { histIdx = idx; inputVal = cmdLog[idx]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const idx = histIdx + 1;
      if (idx >= cmdLog.length) { histIdx = -1; inputVal = ""; }
      else { histIdx = idx; inputVal = cmdLog[idx]; }
    }
  }

  function onCtx(e) {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 210);
    const y = Math.min(e.clientY, window.innerHeight - 320);
    ctxOpen = true;
    ctxX = x;
    ctxY = y;
  }

  function onRootClick(e) {
    if (ctxOpen) ctxOpen = false;
    const sel = window.getSelection();
    const tag = e.target.tagName;
    if ((!sel || !sel.toString()) && tag !== "A" && tag !== "INPUT" && !e.target.closest("[data-cmd]") && !e.target.closest("img")) {
      if (inputEl) inputEl.focus();
    }
  }

  function handleGlobalKey(e) {
    if (booting) {
      finishBoot();
      return;
    }
    if (photoViewer) {
      if (e.key === "ArrowRight") nextPhoto();
      else if (e.key === "ArrowLeft") prevPhoto();
      else if (e.key === "Escape") closePhotoViewer();
    }
  }

  $: bootShownLines = BOOT_LINES.slice(0, bootN).map((t, i) => ({ text: t || " ", color: i >= BOOT_LINES.length - 2 ? th.accent2 : th.dim }));
  $: cwdLabel = lastSection === "home" ? "" : lastSection;
  $: themeList = Object.keys(THEMES).map((k) => ({ id: k, swatch: THEMES[k].swatch, ring: k === tid ? th.accent2 : th.border }));
</script>

<svelte:head>
  <title>Jassim Abdul Latheef</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />
</svelte:head>

<svelte:window on:keydown={handleGlobalKey} />

<div
  class="term"
  role="presentation"
  on:click={onRootClick}
  on:contextmenu={onCtx}
  style="--bg: {th.bg}; --bg2: {th.bg2}; --fg: {th.fg}; --dim: {th.dim}; --accent: {th.accent}; --accent2: {th.accent2}; --border: {th.border}; --link: {th.link};"
>
  <!-- title bar -->
  <div class="titlebar">
    <div class="dots">
      <div class="dot" style="background:#ff5f57;"></div>
      <div class="dot" style="background:#febc2e;"></div>
      <div class="dot" style="background:#28c840;"></div>
    </div>
    <button class="restart-btn" on:click={restart} title="Restart session">⟲ <span class="restart-label">restart</span></button>
    <div class="titlebar-label">guest@jsm.sh — ~/{cwdLabel}</div>
    <div class="theme-dots">
      <span class="theme-label">theme</span>
      {#each themeList as t (t.id)}
        <div class="theme-dot" data-cmd="theme {t.id}" on:click={exec} title={t.id} style="background:{t.swatch}; border-color:{t.ring};"></div>
      {/each}
    </div>
  </div>

  <!-- menu bar -->
  <div class="menubar">
    {#each menuItems as m (m.cmd)}
      <div class="menu-item" data-cmd={m.cmd} on:click={exec} style="color:{m.fg}; background:{m.bg};">{m.label}</div>
    {/each}
  </div>

  <!-- terminal scroll area -->
  <div class="scroll term-scroll" bind:this={scrollEl}>
    {#each displayEntries as entry (entry.idx)}
      <div data-entry="1" data-idx={entry.idx} on:click={(ev) => activate(entry.idx, ev)} style="margin: 0 -14px 4px -14px; padding: 8px 14px 14px 14px; border-radius: 6px; border-left: 2px solid {entry.on ? th.accent : 'transparent'}; background: {entry.on ? th.bg2 : 'transparent'}; opacity: {entry.on ? 1 : 0.4}; transition: opacity .18s ease, background .18s ease; cursor: {entry.on ? 'default' : 'pointer'};">
        <div class="cmd-line">
          <span class="prompt-user">guest@jsm.sh</span><span class="prompt-dim">:~$</span>
          <span class="prompt-cmd">{entry.cmd}</span>
        </div>

        {#if entry.title}
          <div class="entry-title-row">
            <span class="entry-title-prompt">~/{entry.title.toLowerCase()}</span>
            <span class="entry-title">{entry.title}</span>
          </div>
        {/if}

        {#if entry.tText}
          <div style="margin-top: 6px;">
            {#each entry.lines as ln}
              <div style="color: {ln.color}; white-space: pre-wrap;">{ln.text}</div>
            {/each}
          </div>
        {/if}

        {#if entry.tHome}
          <div class="home-block">
            <div class="avatar">
              <img src={jassimImage} alt="jassim" />
              <div class="avatar-tint"></div>
              <div class="avatar-scan"></div>
            </div>
            <div class="home-copy">
              <div class="home-name">Jassim Abdul Latheef</div>
              <div class="home-role"># builder · entrepreneur · cuirious</div>
              <div class="home-bio">Welcome to my corner of the web — a personal archive of discoveries and experiments as I navigate projects and ideas. Browse around; maybe you'll find something interesting.</div>
              <div class="home-chips">
                {#each entry.chips as c}
                  <div class="chip" data-cmd={c} on:click={exec}>{c}</div>
                {/each}
              </div>
              <div class="home-tip">tip: type <span class="accent">help</span>, click anything, or right-click for a menu</div>
            </div>
          </div>
        {/if}

        {#if entry.tAbout}
          <div class="about-block">
            <div class="dim-line">// cat about.md</div>
            <div class="para">I try to make things all the time and break things occasionally. I'm an entrepreneur, currently working at <a href="https://www.glance.care" target="_blank">Glance Care</a> as a co-founder and CTO.</div>
            <div class="para">I've always been curious, and I'm lucky to have found a job that lets me turn that curiosity into something meaningful — helping people improve their lives, bit by bit, while doing what I love.</div>
            <div class="para para-fg">Philosophy: everything we take for granted today is the result of someone's effort to make things better. It's our responsibility to keep pushing humanity forward.</div>
            <div class="about-links">
              <a href="https://x.com/_al_jassim" target="_blank">x/@_al_jassim</a>
              <a href="https://www.linkedin.com/in/jassimabdullatheef/" target="_blank">linkedin/jassimabdullatheef</a>
              <a href="mailto:hi@jsm.sh">hi@jsm.sh</a>
            </div>
          </div>
        {/if}

        {#if entry.tProjects}
          <div class="projects-block">
            {#each PROJECTS as p}
              <div class="project-card">
                <div class="project-name">{p.name}</div>
                <div class="project-desc">{p.desc}</div>
                <a href={p.href} class="project-link">./open {p.name.replace('/', '')} →</a>
              </div>
            {/each}
          </div>
        {/if}

        {#if entry.tBlog}
          <div class="blog-block">
            <div class="dim-small">{entry.blogCount} posts — click one to read</div>
            {#each entry.posts as p}
              <div class="post-row" data-cmd="open {p.slug}" on:click={exec}>
                <div class="post-date">{p.date}</div>
                <div>
                  <div class="post-title">{p.title}</div>
                  <div class="post-tags">{p.tagStr}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if entry.tPost}
          <div class="post-block">
            <div class="post-breadcrumb">
              <span class="back-link" data-cmd="blog" on:click={exec}>← blog</span>
              <span class="sep">/</span>
              <span class="dim-small">reading</span>
            </div>
            <div class="post-page-title">{entry.pTitle}</div>
            <div class="dim-small post-meta">{entry.pDate} · {entry.pTags}</div>
            <div class="post-content">{@html entry.pContent}</div>
            <a href={entry.pHref} class="post-full-link">permalink →</a>
          </div>
        {/if}

        {#if entry.tLibrary}
          <div class="library-block">
            <div class="dim-small">// {entry.libCount} books · synced from Goodreads</div>
            <div class="books-grid">
              {#each entry.books.slice(0, libraryShown[entry.idx] ?? LIBRARY_PAGE_SIZE) as b}
                <div class="book">
                  <div class="book-cover"><img src={b.cover} alt={b.title} loading="lazy" /></div>
                  <div class="book-title">{b.title}</div>
                  <div class="book-author">{b.author}</div>
                  <div class="book-meta">
                    <span class="book-rating">{b.rating}</span>
                    <span class="book-status" style="color:{b.status === 'reading' ? th.accent : th.dim};">{b.status}</span>
                  </div>
                </div>
              {/each}
            </div>
            {#if (libraryShown[entry.idx] ?? LIBRARY_PAGE_SIZE) < entry.books.length}
              <button class="load-more" on:click={() => loadMoreBooks(entry.idx, entry.books.length)}>
                load more ({entry.books.length - (libraryShown[entry.idx] ?? LIBRARY_PAGE_SIZE)} remaining) →
              </button>
            {/if}
          </div>
        {/if}

        {#if entry.tMusic}
          <div class="music-block">
            <div class="para">Music student & amaeture producer</div>
            <div class="stream-block">
              <div class="dim-small stream-label">// stream --source soundcloud</div>
              <button class="open-player" on:click={openMusicPlayer}>▶ open player</button>
            </div>
          </div>
        {/if}

        {#if entry.tPhotos}
          <div class="photos-block">
            {#if !photoAlbumSel[entry.idx]}
              <div class="dim-small">// ls ~/photography — {data.albums.length} albums</div>
              <div class="albums-grid">
                {#each data.albums as al}
                  <div class="album-card" on:click={(e) => { e.stopPropagation(); openAlbum(entry.idx, al.key); }}>
                    <div class="album-cover"><img src={al.cover} alt={al.label} loading="lazy" /></div>
                    <div class="album-label">{al.label}</div>
                    <div class="album-count">{al.count} photos</div>
                  </div>
                {/each}
              </div>
            {:else}
              {@const album = data.albums.find((a) => a.key === photoAlbumSel[entry.idx])}
              <div class="album-header">
                <span class="back-link" on:click={(e) => { e.stopPropagation(); closeAlbum(entry.idx); }}>← albums</span>
                <span class="sep">/</span>
                <span class="dim-small">{album?.label}</span>
              </div>
              <div class="photos-grid">
                {#each album?.photos ?? [] as src, i}
                  <div class="photo" on:click={(e) => { e.stopPropagation(); openPhotoViewer(album.photos, i, album.label); }}><img {src} alt="" loading="lazy" /></div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if entry.tHelp}
          <div class="help-block">
            {#each entry.helpRows as h}
              <div class="help-row">
                <div class="help-cmd" data-cmd={h.cmd} on:click={exec}>{h.label}</div>
                <div class="dim-small">{h.desc}</div>
              </div>
            {/each}
          </div>
        {/if}

        {#if entry.tCow}
          <pre class="cow">{entry.cow}</pre>
        {/if}

        {#if entry.tFetch}
          <div class="fetch-block">
            <pre class="fetch-art">{entry.art}</pre>
            <div class="fetch-info">
              <div><span class="accent2-b">guest</span><span class="dim-small">@</span><span class="accent2-b">jsm.sh</span></div>
              <div class="dim-small">─────────────</div>
              <div><span class="accent">OS</span>: JSM/OS 3.0 (web)</div>
              <div><span class="accent">Role</span>: Co-founder &amp; CTO, Glance Care</div>
              <div><span class="accent">Shell</span>: jsh 1.0</div>
              <div><span class="accent">Theme</span>: {tid}</div>
              <div><span class="accent">Uptime</span>: curious since forever</div>
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <!-- input line -->
    <div class="input-line">
      <span class="prompt-user" style="white-space: nowrap;">guest@jsm.sh</span><span class="prompt-dim">:~$</span>
      <input
        bind:this={inputEl}
        bind:value={inputVal}
        on:keydown={onKey}
        autofocus
        spellcheck="false"
        autocomplete="off"
      />
    </div>
    {#if ghostMatch}
      <div class="ghost">tab ⇥ to complete: {ghostMatch}</div>
    {/if}
  </div>

  <!-- context menu -->
  {#if ctxOpen}
    <div class="ctx-menu" style="left: {ctxX}px; top: {ctxY}px;">
      {#each ctxItems as ci}
        {#if ci.isHeader}
          <div class="ctx-header">{ci.label}</div>
        {:else if ci.isItem}
          <div class="ctx-item" data-cmd={ci.cmd} on:click={exec}>{ci.label}</div>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- photo viewer window -->
  {#if photoViewer}
    <FloatingWindow
      title={photoViewer.label}
      bind:x={photoWin.x}
      bind:y={photoWin.y}
      bind:width={photoWin.width}
      bind:height={photoWin.height}
      minWidth={220}
      minHeight={180}
      on:close={closePhotoViewer}
    >
      <div class="viewer">
        <button class="viewer-nav viewer-prev" on:click|stopPropagation={prevPhoto} aria-label="Previous photo">‹</button>
        <img src={photoViewer.photos[photoViewer.index]} alt="" class="viewer-img" />
        <button class="viewer-nav viewer-next" on:click|stopPropagation={nextPhoto} aria-label="Next photo">›</button>
        <div class="viewer-counter">{photoViewer.index + 1} / {photoViewer.photos.length}</div>
      </div>
    </FloatingWindow>
  {/if}

  <!-- music player window -->
  {#if musicPlayerOpen}
    <FloatingWindow
      title="stream --source soundcloud"
      bind:x={musicWin.x}
      bind:y={musicWin.y}
      bind:width={musicWin.width}
      bind:height={musicWin.height}
      minWidth={220}
      minHeight={160}
      on:close={closeMusicPlayer}
    >
      <div class="player-wrap">
        <iframe title="soundcloud player" width="100%" height="100%" scrolling="no" frameborder="no" allow="autoplay" src={MUSIC_EMBED_URL}></iframe>
      </div>
    </FloatingWindow>
  {/if}

  <!-- scanlines -->
  <div class="scanlines"></div>

  <!-- boot overlay -->
  {#if booting}
    <div class="boot" data-cmd="__skipboot" on:click={exec}>
      {#each bootShownLines as bl}
        <div style="color: {bl.color}; font-size: 13px; white-space: pre-wrap;">{bl.text}</div>
      {/each}
      <div class="boot-hint">press any key or click to skip</div>
    </div>
  {/if}
</div>

<style lang="scss">
  :global(html, body) {
    margin: 0;
    padding: 0;
  }

  .term {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg, #070c08);
    color: var(--fg, #9fe8b2);
    font-family: "JetBrains Mono", monospace;
    font-size: 14px;
    line-height: 1.6;
    overflow: hidden;
    position: relative;
  }

  .term :global(a) {
    color: var(--link, #7de8a4);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .term :global(a:hover) {
    color: var(--accent2, #b7ffd0);
  }
  .term ::selection {
    background: var(--dim, #4e7a5c);
    color: var(--bg, #070c08);
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 16px;
    background: var(--bg2, #0c130d);
    border-bottom: 1px solid var(--border, #1b2e20);
    flex-shrink: 0;
  }
  .dots { display: flex; gap: 7px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .restart-btn {
    background: transparent;
    border: 1px solid var(--border, #1b2e20);
    color: var(--dim, #4e7a5c);
    padding: 3px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    flex-shrink: 0;
  }
  .restart-btn:hover { color: var(--accent2, #b7ffd0); background: var(--border, #1b2e20); }
  .titlebar-label {
    flex: 1;
    min-width: 0;
    text-align: center;
    color: var(--dim, #4e7a5c);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .theme-dots { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
  .theme-label { color: var(--dim, #4e7a5c); font-size: 11px; margin-right: 2px; }
  .theme-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid; cursor: pointer; }

  .menubar {
    display: flex;
    gap: 4px;
    padding: 6px 12px;
    background: var(--bg2, #0c130d);
    border-bottom: 1px solid var(--border, #1b2e20);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .menu-item {
    padding: 3px 12px;
    cursor: pointer;
    font-size: 12.5px;
    border-radius: 4px;
    &:hover { color: var(--accent2, #b7ffd0); background: var(--border, #1b2e20); }
  }

  .scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px 30vh 24px;
  }
  .term-scroll::-webkit-scrollbar { width: 10px; }
  .term-scroll::-webkit-scrollbar-track { background: transparent; }
  .term-scroll::-webkit-scrollbar-thumb { background: var(--border, #1b2e20); border-radius: 5px; }

  .cmd-line { display: flex; gap: 8px; flex-wrap: wrap; }
  .prompt-user { color: var(--accent, #3dd97a); font-weight: 500; }
  .prompt-dim { color: var(--dim, #4e7a5c); }
  .prompt-cmd { color: var(--fg, #9fe8b2); }

  .entry-title-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin-top: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border, #1b2e20);
  }
  .entry-title-prompt { color: var(--dim, #4e7a5c); font-size: 13px; }
  .entry-title { font-size: 26px; font-weight: 700; color: var(--accent2, #b7ffd0); letter-spacing: -0.01em; }

  .home-block { margin-top: 14px; display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
  .avatar {
    position: relative;
    width: 128px;
    height: 128px;
    flex-shrink: 0;
    border: 1px solid var(--border, #1b2e20);
    padding: 4px;
    background: var(--bg2, #0c130d);
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: grayscale(1) contrast(1.25) brightness(0.95);
    }
  }
  .avatar-tint { position: absolute; inset: 4px; background: var(--accent, #3dd97a); mix-blend-mode: multiply; opacity: 0.45; pointer-events: none; }
  .avatar-scan { position: absolute; inset: 4px; background: repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 3px); pointer-events: none; }
  .home-copy { flex: 1; min-width: 280px; }
  .home-name { font-size: 22px; font-weight: 700; color: var(--accent2, #b7ffd0); }
  .home-role { color: var(--dim, #4e7a5c); margin-bottom: 10px; }
  .home-bio { max-width: 62ch; text-wrap: pretty; }
  .home-chips { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .home-tip { color: var(--dim, #4e7a5c); margin-top: 14px; font-size: 12px; }
  .accent { color: var(--accent, #3dd97a); }

  .chip {
    border: 1px solid var(--border, #1b2e20);
    color: var(--accent, #3dd97a);
    padding: 3px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    &:hover { background: var(--border, #1b2e20); color: var(--accent2, #b7ffd0); }
  }

  .about-block { margin-top: 10px; max-width: 72ch; }
  .dim-line { color: var(--dim, #4e7a5c); }
  .dim-small { color: var(--dim, #4e7a5c); font-size: 12.5px; }
  .para { margin-top: 10px; text-wrap: pretty; }
  .para-fg { color: var(--fg, #9fe8b2); }
  .about-links { margin-top: 14px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; }

  .projects-block { margin-top: 10px; display: flex; gap: 14px; flex-wrap: wrap; }
  .project-card {
    border: 1px solid var(--border, #1b2e20);
    background: var(--bg2, #0c130d);
    border-radius: 6px;
    padding: 16px 18px;
    width: 340px;
  }
  .project-name { color: var(--accent2, #b7ffd0); font-weight: 700; }
  .project-desc { font-size: 13px; margin-top: 6px; text-wrap: pretty; }
  .project-link { font-size: 12.5px; display: inline-block; margin-top: 10px; }

  .blog-block { margin-top: 10px; }
  .post-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 14px;
    padding: 9px 10px;
    border-radius: 4px;
    cursor: pointer;
    border-left: 2px solid transparent;
    margin-bottom: 8px;
    &:hover { background: var(--bg2, #0c130d); border-left: 2px solid var(--accent, #3dd97a); }
  }
  .post-date { color: var(--dim, #4e7a5c); font-size: 12.5px; }
  .post-title { color: var(--fg, #9fe8b2); font-weight: 500; }
  .post-tags { color: var(--dim, #4e7a5c); font-size: 12.5px; margin-top: 2px; }

  .post-block { margin-top: 14px; max-width: 74ch; }
  .post-breadcrumb { display: flex; align-items: baseline; gap: 12px; }
  .back-link { color: var(--dim, #4e7a5c); font-size: 12.5px; cursor: pointer; &:hover { color: var(--accent2, #b7ffd0); } }
  .sep { color: var(--border, #1b2e20); }
  .post-page-title { font-size: 27px; font-weight: 700; color: var(--accent2, #b7ffd0); text-wrap: pretty; line-height: 1.25; margin-top: 10px; }
  .post-meta { margin: 8px 0 4px 0; }
  .post-content { margin: 14px 0; font-size: 14.5px; }
  .post-content :global(p) { margin: 0 0 14px 0; line-height: 1.75; text-wrap: pretty; }
  .post-content :global(h1),
  .post-content :global(h2),
  .post-content :global(h3) { color: var(--accent2, #b7ffd0); margin: 22px 0 10px; line-height: 1.3; }
  .post-content :global(h2) { font-size: 19px; }
  .post-content :global(h3) { font-size: 16px; }
  .post-content :global(ul),
  .post-content :global(ol) { margin: 0 0 14px 0; padding-left: 22px; }
  .post-content :global(li) { margin-bottom: 6px; }
  .post-content :global(img) { max-width: 100%; border-radius: 6px; margin: 10px 0; display: block; }
  .post-content :global(blockquote) { border-left: 2px solid var(--border, #1b2e20); padding-left: 14px; margin: 14px 0; color: var(--dim, #4e7a5c); }
  .post-content :global(code) { background: var(--bg2, #0c130d); padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
  .post-content :global(pre) { background: var(--bg2, #0c130d); padding: 12px 14px; border-radius: 6px; overflow-x: auto; margin: 14px 0; }
  .post-content :global(pre code) { background: none; padding: 0; }
  .post-content :global(em) { color: var(--fg, #9fe8b2); }
  .post-content :global(strong) { color: var(--accent2, #b7ffd0); }
  .post-content :global(.sidenote-ref) { position: relative; cursor: help; }
  .post-content :global(.sidenote-marker) { display: inline-flex; align-items: center; color: var(--accent, #3dd97a); margin-left: 0.3em; vertical-align: super; line-height: 1; }
  .post-content :global(.sidenote-icon) { width: 1em; height: 1em; }
  .post-content :global(.sidenote-content) {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: var(--bg2, #0c130d);
    border: 1px solid var(--border, #1b2e20);
    color: var(--fg, #9fe8b2);
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 12.5px;
    line-height: 1.5;
    width: 260px;
    max-width: 80vw;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 5;
  }
  .post-content :global(.sidenote-ref:hover .sidenote-content) { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(-12px); }
  .post-content :global(.ps-note) {
    margin: 24px 0;
    padding: 16px 20px;
    background: var(--bg2, #0c130d);
    border-left: 3px solid var(--accent, #3dd97a);
    border-radius: 6px;
    font-style: italic;
  }
  .post-content :global(.ps-label) { color: var(--accent2, #b7ffd0); font-weight: 700; font-style: normal; margin-bottom: 6px; }
  .post-full-link { display: inline-block; margin-top: 4px; font-size: 13px; }

  .library-block { margin-top: 10px; }
  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 18px; max-width: 980px; margin-bottom: 14px; }
  .book { display: flex; flex-direction: column; }
  .book-cover {
    aspect-ratio: 2 / 3;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    border: 1px solid var(--border, #1b2e20);
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
  }
  .book-title { color: var(--fg, #9fe8b2); font-size: 13px; font-weight: 500; margin-top: 8px; line-height: 1.35; text-wrap: pretty; }
  .book-author { color: var(--dim, #4e7a5c); font-size: 12px; }
  .book-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  .book-rating { color: var(--accent, #3dd97a); font-size: 11px; }
  .book-status { font-size: 11px; }
  .load-more {
    display: inline-block;
    background: transparent;
    border: 1px solid var(--border, #1b2e20);
    color: var(--accent, #3dd97a);
    padding: 5px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12.5px;
    font-family: inherit;
  }
  .load-more:hover { background: var(--border, #1b2e20); color: var(--accent2, #b7ffd0); }

  .music-block { margin-top: 10px; max-width: 62ch; }
  .accent2-b { color: var(--accent2, #b7ffd0); font-weight: 700; }
  .stream-block { margin-top: 16px; }
  .stream-label { margin-bottom: 8px; }
  .open-player {
    display: inline-block;
    background: transparent;
    border: 1px solid var(--border, #1b2e20);
    color: var(--accent, #3dd97a);
    padding: 5px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12.5px;
    font-family: inherit;
  }
  .open-player:hover { background: var(--border, #1b2e20); color: var(--accent2, #b7ffd0); }

  .photos-block { margin-top: 10px; }
  .albums-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; max-width: 900px; margin-top: 10px; }
  .album-card { cursor: pointer; }
  .album-cover { height: 130px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border, #1b2e20); img { width: 100%; height: 100%; object-fit: cover; display: block; } }
  .album-label { color: var(--fg, #9fe8b2); font-size: 13px; font-weight: 500; margin-top: 6px; }
  .album-count { color: var(--dim, #4e7a5c); font-size: 12px; }
  .album-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
  .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-width: 900px; margin-bottom: 14px; }
  .photo { height: 150px; border-radius: 4px; overflow: hidden; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; display: block; } }

  .viewer {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
  }
  .viewer-img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .viewer-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.4);
    border: none;
    color: #fff;
    font-size: 28px;
    line-height: 1;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
  }
  .viewer-nav:hover { background: rgba(0, 0, 0, 0.65); }
  .viewer-prev { left: 10px; }
  .viewer-next { right: 10px; }
  .viewer-counter {
    position: absolute;
    bottom: 10px;
    right: 14px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
  }

  .player-wrap { position: absolute; inset: 0; }
  .player-wrap iframe { display: block; }

  .help-block { margin-top: 10px; font-size: 13px; }
  .help-row { display: grid; grid-template-columns: 190px 1fr; gap: 10px; padding: 2px 0; max-width: 640px; }
  .help-cmd { color: var(--accent, #3dd97a); cursor: pointer; &:hover { color: var(--accent2, #b7ffd0); } }

  .cow { margin: 8px 0 0 0; font-family: inherit; color: var(--fg, #9fe8b2); line-height: 1.3; }

  .fetch-block { margin-top: 10px; display: flex; gap: 24px; align-items: flex-start; }
  .fetch-art { margin: 0; font-family: inherit; color: var(--accent, #3dd97a); line-height: 1.25; font-size: 12px; }
  .fetch-info { font-size: 13px; }

  .input-line { display: flex; gap: 8px; align-items: baseline; }
  .input-line input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--fg, #9fe8b2);
    font-size: 14px;
    caret-color: var(--accent, #3dd97a);
    padding: 0;
    font-family: inherit;
  }
  .ghost { color: var(--dim, #4e7a5c); font-size: 12px; margin-top: 2px; margin-left: 2px; }

  .ctx-menu {
    position: fixed;
    background: var(--bg2, #0c130d);
    border: 1px solid var(--border, #1b2e20);
    border-radius: 6px;
    padding: 6px;
    z-index: 50;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    min-width: 190px;
    font-size: 13px;
  }
  .ctx-header { color: var(--dim, #4e7a5c); font-size: 11px; padding: 6px 10px 2px 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  .ctx-item {
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--fg, #9fe8b2);
    &:hover { background: var(--border, #1b2e20); color: var(--accent2, #b7ffd0); }
  }

  .scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 40;
    background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0, 0, 0, 0.07) 4px);
    mix-blend-mode: multiply;
  }

  .boot {
    position: absolute;
    inset: 0;
    background: var(--bg, #070c08);
    z-index: 60;
    padding: 40px;
    cursor: pointer;
  }
  .boot-hint { color: var(--dim, #4e7a5c); font-size: 11px; position: absolute; bottom: 24px; left: 40px; }

  @media (max-width: 640px) {
    .titlebar { gap: 8px; padding: 8px 10px; }
    .restart-label { display: none; }
    .restart-btn { padding: 4px 8px; }
    .theme-dots { display: none; }
    .titlebar-label { font-size: 11px; }
    .menu-item { padding: 3px 9px; font-size: 11.5px; }

    .scroll { padding: 14px 12px 40vh 12px; }

    .entry-title { font-size: 20px; }
    .entry-title-row { gap: 8px; }

    .avatar { width: 88px; height: 88px; }
    .home-block { gap: 14px; }
    .home-bio { max-width: 100%; }

    .project-card { width: 100%; }

    .post-row { grid-template-columns: 80px 1fr; gap: 8px; }
    .post-page-title { font-size: 21px; }

    .books-grid { grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 12px; }

    .albums-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    .album-cover { height: 100px; }
    .photos-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
    .photo { height: 100px; }

    .help-row { grid-template-columns: 130px 1fr; }

    .fetch-block { flex-direction: column; gap: 10px; }

    .viewer-nav { width: 34px; height: 34px; font-size: 22px; }

    .boot { padding: 20px; }
    .boot-hint { bottom: 14px; left: 20px; }
  }
</style>
