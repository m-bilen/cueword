# Cueword Privacy Policy

Last updated: October 2026
[Türkçe](PRIVACY.tr.md)

Cueword is a Chrome extension that explains words you select in subtitles and helps you review them. This page explains exactly what data it handles. Cueword is open source, so you can check every claim here in the code: https://github.com/m-bilen/cueword

## The short version

- Your words, their explanations and your settings stay in your browser.
- The only things that leave your browser are the text you select and the subtitle sentence around it, sent to Google Gemini with your own API key.
- The developer never receives any of your data. There is no server, no account, no analytics and no tracking.
- Cueword does not sell your data, and does not share it with anyone except Google's Gemini API as described below.

## What Cueword stores

Everything Cueword saves stays in your browser, in Chrome's local extension storage:

- the words and lines you select, and their explanations
- the subtitle sentence they appeared in
- the video timestamp and the page address where you selected them
- your session (show or movie) names
- your review progress
- your settings, including your Gemini API key

Your API key is stored as plain text in this local storage, like the rest of your settings. Other websites and other extensions cannot read it, but anyone with access to your Chrome profile on your computer could. The key is only ever sent to Google's Gemini API, as part of each request.

## What Cueword sends, and to whom

When you select a word, Cueword sends the selected text and the subtitle sentence around it to the Google Gemini API over an encrypted (HTTPS) connection, using your own API key. The request also says which language to explain in. Nothing else is sent: not the page address, not the timestamp, not your other words.

Google handles this request under its own terms: the [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms) and the [Google Privacy Policy](https://policies.google.com/privacy). If you use a free (unpaid) API key, Google's terms allow it to use the content you send to improve its products, and human reviewers may read it. With a paid key, Google says it does not use your content this way. Cueword only sends text you selected yourself, but avoid selecting personal or sensitive text.

Your data is used only to explain your selections and to let you review them. It is never used for advertising or for any other purpose.

## How Cueword reads web pages

Subtitles appear on many different streaming sites, so Cueword runs on every page you visit. On those pages it only checks whether you are holding the Alt key; it does not record what you type. It reads text only when you hold Alt and select something, and then only the selection and the subtitle line or paragraph around it. It does not read, collect or send pages in the background.

## Permissions

- **storage:** to save your words and settings in your browser.
- **sidePanel:** to show your word list next to the video.
- **Access to generativelanguage.googleapis.com:** to send your selection to Gemini.
- **Access to all websites:** to let you select subtitles on any streaming site, as described above.

## Deleting your data

You can delete words and sessions in the panel at any time. Removing the extension deletes all of its stored data from your browser.

## Age

Google's Gemini API may only be used by people who are 18 or older. Cueword is not intended for anyone under 18.

## Changes

If this policy changes, the new version will be published here with a new date.

## Contact

bilen.mehmet2408@gmail.com