<div align="center">

<img src="docs/assets/.readme/01-hero.png" alt="Masla-e-Karachi" width="100%">

<br>
<br>

# MASLA-E-KARACHI

**Masla batao, hisaab lo.**

An anonymous civic reporting platform for the people of Karachi.<br>
Report a problem. Pin it on a public map. Hold the system accountable.

<br>

[![Live Site](https://img.shields.io/badge/Live_Site-Visit-39FF14?style=for-the-badge&labelColor=0d0d0d)](https://buildsbyaliyan.github.io/masla-e-karachi-landing/)
&nbsp;
[![Platform](https://img.shields.io/badge/Platform-maslaekarachi.pk-39FF14?style=for-the-badge&labelColor=0d0d0d)](https://maslaekarachi.pk)

![HTML5](https://img.shields.io/badge/HTML5-0d0d0d?style=flat-square&logo=html5&logoColor=39FF14)
![CSS3](https://img.shields.io/badge/CSS3-0d0d0d?style=flat-square&logo=css3&logoColor=39FF14)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-0d0d0d?style=flat-square&logo=javascript&logoColor=39FF14)
![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-0d0d0d?style=flat-square&logo=github&logoColor=39FF14)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-0d0d0d?style=flat-square&labelColor=0d0d0d&color=39FF14)

<br>

[Overview](#overview) &nbsp;•&nbsp;
[The Problem](#the-problem--the-solution) &nbsp;•&nbsp;
[How It Works](#how-it-works) &nbsp;•&nbsp;
[Accountability](#built-for-accountability) &nbsp;•&nbsp;
[Getting Started](#getting-started) &nbsp;•&nbsp;
[Customization](#customization) &nbsp;•&nbsp;
[Deployment](#deployment) &nbsp;•&nbsp;
[Credits](#credits)

</div>

<br>

## OVERVIEW

This repository contains the **official landing website** for Masla-e-Karachi: a clean, fast, framework-free introduction to the platform and its mission.

> [!NOTE]
> This repo is the landing site only. The full reporting platform is currently **under development** at [maslaekarachi.pk](https://maslaekarachi.pk).

|  |  |
| :-- | :-- |
| **Live site** | [buildsbyaliyan.github.io/masla-e-karachi-landing](https://buildsbyaliyan.github.io/masla-e-karachi-landing/) |
| **Platform** | [maslaekarachi.pk](https://maslaekarachi.pk) *(in development)* |
| **Stack** | Plain HTML, CSS and vanilla JavaScript |
| **Tooling** | No frameworks. No npm. No build step. |
| **Language** | English |
| **Theme** | Dark charcoal with neon green |
| **Pages** | Home · How It Works · Privacy · FAQ · Terms · 404 |

<br>

## THE PROBLEM / THE SOLUTION

<div align="center">
<img src="docs/assets/.readme/02-problem-solution.png" alt="The problem: open gutters, broken roads, uncollected garbage, fear of being exposed. The solution: report anonymously, public problem map, officer must respond, proof plus community check." width="100%">
</div>

<br>

Karachi's everyday problems are visible to everyone, yet most go unreported because people fear being exposed. Masla-e-Karachi removes that barrier: **no name, no login, just the problem and the proof.**

<br>

## HOW IT WORKS

<div align="center">
<img src="docs/assets/.readme/03-how-it-works.png" alt="How it works: four steps — Category, Location, Photo or Video, Details — followed by a secret tracking code." width="100%">
</div>

<br>

| Step | Action | Description |
| :-: | :-- | :-- |
| **01** | **Category** | Pick the type of problem |
| **02** | **Location** | Drop a pin on the map |
| **03** | **Photo / Video** | Attach a photo or a 30-second video |
| **04** | **Details** | Describe the issue |

On submission, every report receives a **secret tracking code** (e.g. `MEK-8F3K-92`), so the reporter can follow progress at any time without ever creating an account.

<br>

## BUILT FOR ACCOUNTABILITY

<div align="center">
<img src="docs/assets/.readme/04-accountability.png" alt="Built for accountability: anonymous, public map, 7-day overdue flag, department ranking." width="100%">
</div>

<br>

| Feature | What it means |
| :-- | :-- |
| **Anonymous** | No name, phone number or login required |
| **Public Map** | Every problem is pinned and visible to everyone |
| **7-Day Overdue Flag** | Reports with no response after 7 days are flagged |
| **Department Ranking** | Departments are ranked on real data, not likes |

> [!WARNING]
> Masla-e-Karachi is **not an emergency service**. If life is in danger, call **15**.

<br>

---

<br>

## GETTING STARTED

Run the site locally with a single command from the project root:

```bash
python3 -m http.server 8000 -d docs
```

Then open **http://localhost:8000** in your browser. There is nothing to install or build.

### PROJECT STRUCTURE

```text
masla-e-karachi-landing/
├── docs/                      # The complete website (served by GitHub Pages)
│   ├── *.html                 # 6 pages
│   ├── css/                   # variables, base, layout, components, pages (bundled)
│   ├── js/                    # config, i18n, main, counter, faq, base-404
│   ├── lang/en.json           # All site text, in one file
│   ├── assets/                # Fonts, images, favicons
│   └── humans.txt · robots.txt · sitemap.xml · .nojekyll
├── tools/                     # Helper scripts and sources (not deployed)
└── project-reference/         # Project context files (not deployed)
```

<br>

## CUSTOMIZATION

| To change | Edit |
| :-- | :-- |
| **Links and settings** | `docs/js/config.js` — platform link, contact email, site URL, developer info |
| **Contact email** | `CONTACT_EMAIL` in `docs/js/config.js`. If left empty, the FAQ shows *"Contact email will be added at launch."* |
| **Text content** | `docs/lang/en.json` — the only file that holds site copy |
| **Colors, fonts, spacing** | `docs/css/variables.css` |
| **Layout and components** | `docs/css/layout.css`, `components.css`, `pages.css` — each section is marked with `/* >>> ... */` |

<details>
<summary><b>Adding or editing text</b></summary>

<br>

English text is already written inline in the HTML, and the JSON file keeps it in sync. To add a new string:

1. Add `data-i18n="your.key"` to the element in the HTML.
2. Add the matching `your.key` entry to `docs/lang/en.json`.

</details>

> [!IMPORTANT]
> The site enforces a strict **Content-Security-Policy**. Inline `style=""` attributes, inline `<script>` tags and CDN resources are **not allowed**. Keep all paths **relative**.

### DEVELOPER TOOLS

Run from the project root: `python3 tools/<script>.py docs`

| Script | Purpose |
| :-- | :-- |
| `make_favicons.py` | Generates every favicon size from `tools/favicon-source/favicon.png` *(requires Pillow)* |
| `apply_author_meta.py` | Applies author meta tags and JSON-LD `sameAs` links from `developer.json` |
| `find_unused.py` | Reports unused files, CSS classes and language keys *(read-only, deletes nothing)* |
| `developer.json` | Developer name and links. Keep in sync with `DEVELOPER` in `docs/js/config.js` |

<br>

## DEPLOYMENT

The site deploys to **GitHub Pages** straight from the `docs/` folder.

1. Push the repository to GitHub.
2. Go to **Settings → Pages** and select branch `main`, folder `/docs`.
3. The site goes live at `https://<username>.github.io/<repo-name>/`.

<details>
<summary><b>Renaming the repository or username</b></summary>

<br>

Replace the old URL with the new one in:

- `docs/*.html` — canonical, `og:url`, `og:image`, JSON-LD
- `docs/sitemap.xml`
- `docs/robots.txt`
- `SITE_URL` in `docs/js/config.js`

</details>

<details>
<summary><b>Using a custom domain</b></summary>

<br>

Create `docs/CNAME` containing **one line**: the domain only, with no `https://` and no blank lines.

> [!CAUTION]
> If you are not using a custom domain, do not keep a `docs/CNAME` file. An empty `CNAME` can break GitHub Pages.

</details>

<br>

---

<br>

## CREDITS

<div align="center">
<img src="docs/assets/.readme/05-credits-footer.png" alt="Designed and built by Aliyan Saleem. HTML, CSS, JavaScript, GitHub Pages. Plain code. No frameworks. No build step." width="100%">

<br>
<br>

**Designed & developed by Aliyan Saleem**

[![Portfolio](https://img.shields.io/badge/Portfolio-0d0d0d?style=for-the-badge&logo=vercel&logoColor=39FF14)](https://portfolio-aliyan-saleem.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0d0d0d?style=for-the-badge&logo=linkedin&logoColor=39FF14)](https://www.linkedin.com/in/aliyan-saleem-02a596378/)
[![YouTube](https://img.shields.io/badge/YouTube-0d0d0d?style=for-the-badge&logo=youtube&logoColor=39FF14)](https://www.youtube.com/@apexmotive.official)
[![Instagram](https://img.shields.io/badge/Instagram-0d0d0d?style=for-the-badge&logo=instagram&logoColor=39FF14)](https://www.instagram.com/creativestudi0.pk_/)
[![GitHub](https://img.shields.io/badge/GitHub-0d0d0d?style=for-the-badge&logo=github&logoColor=39FF14)](https://github.com/BuildsByAliyan)

<br>

<sub>Fonts: Inter, Space Grotesk and DM Mono, licensed under the SIL Open Font License 1.1.<br>License texts are in <code>docs/assets/fonts/licenses/</code>.</sub>

<br>

**Masla batao, hisaab lo.**

</div>
