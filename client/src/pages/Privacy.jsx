import { Link, useNavigate } from 'react-router-dom';

// Plain-language note; keep in sync with the "Privacy" section of the README.
export default function Privacy() {
  const nav = useNavigate();
  return (
    <div className="page privacy">
      <h2>Privacy</h2>
      <p>Digital Closet is a student project that runs on free services. Here is exactly who sees what.</p>
      <dl>
        <dt>On your device</dt>
        <dd>Background removal, tagging (what kind of clothing it is), color detection and the shuffle all run in your browser. Your original photos are never uploaded; only the finished cut-out is. Your login token and a typed city name are kept in this browser's storage.</dd>
        <dt>Cloudinary (image storage)</dt>
        <dd>Stores the cut-out image of each item. Images are not listed anywhere, and each has a long random address, but anyone who has an image's exact link can open it. Deleting an item or your account deletes the image.</dd>
        <dt>MongoDB Atlas (database)</dt>
        <dd>Stores your email, a scrambled (hashed) password, display name, and for each item its name, category, color, style, pattern, season and image link. Also your avatars, outfits and daily AI-use counters. No images.</dd>
        <dt>Render (server) and GitHub Pages (website)</dt>
        <dd>Render runs the app's server and GitHub serves the website. Like any host, they can see technical request details such as your IP address.</dd>
        <dt>Google Gemini (optional AI stylist)</dt>
        <dd>Only when you tap "Ask the AI stylist". It receives short text tags per item (category, color code, style, pattern, season), the occasion and a weather label such as "cool and rainy". Never photos, item names, your email or your location. On Google's free tier, submitted text may be used to improve Google's products, which is why only anonymous tags are sent.</dd>
        <dt>Open-Meteo (weather)</dt>
        <dd>Receives your coordinates (only if you allow location) or the city name you type, and nothing about your closet.</dd>
        <dt>Model downloads</dt>
        <dd>The first time you add an item, your browser downloads AI model files from Hugging Face and IMG.LY's CDN. They see your IP address like any download; your photos stay on your device.</dd>
      </dl>
      <p>No ads and no tracking or analytics. You can download all your data, or delete it, from the <Link to="/account">Account</Link> screen. Deleting removes database records and Cloudinary images immediately.</p>
      <button className="link" onClick={() => nav(-1)}>Back</button>
    </div>
  );
}
