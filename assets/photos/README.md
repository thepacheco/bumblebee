# Your story photos

Drop image files in **this folder** (`assets/photos/`) named:

```
1.jpg
2.jpg
3.jpg
…up to 12.jpg
```

They'll automatically appear in the 📖 story photo section on the check-in page,
and any number you don't add is simply skipped. Tap a photo there to view it full-size.

- Use `.jpg` files named `1.jpg`, `2.jpg`, … in order.
- On GitHub: open this `assets/photos/` folder → **Add file → Upload files** → drag your
  photos in (rename them 1.jpg, 2.jpg, …) → Commit. Vercel redeploys automatically.
- Want more than 12, or different names? Tell me and I'll adjust `STORY_PHOTOS` in `js/checkin.js`.
