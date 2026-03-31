# 🍳 Leftover Chef — AI Recipe Generator

Turn your leftover food into delicious meals using **Google Gemini Vision AI** + **MongoDB** + a beautiful web interface.

---

## ✨ Features

- 📸 **Camera capture** or **photo upload** — snap your leftovers directly
- 🤖 **Gemini 1.5 Flash** — identifies every ingredient and crafts a custom recipe
- 🗄️ **MongoDB** — stores every recipe with images for history
- ⭐ **Star ratings** — rate recipes and store feedback
- 📚 **Recipe history** — browse all previously generated recipes
- 🖨️ **Print-friendly** — print any recipe cleanly

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/leftover-chef
PORT=3000
```

**Get your free Gemini API key:** https://aistudio.google.com/app/apikey

### 3. Start MongoDB (if running locally)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) — just paste your connection string in .env
```

### 4. Start the server
```bash
npm start
```

### 5. Open your browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
leftover-chef/
├── public/
│   └── index.html          # Full frontend (HTML + CSS + JS)
├── server/
│   ├── index.js            # Express server + Gemini + MongoDB routes
│   └── models.js           # Mongoose Recipe schema
├── .env.example            # Environment variable template
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript |
| Backend   | Node.js, Express.js |
| AI Vision | Google Gemini 1.5 Flash |
| Database  | MongoDB + Mongoose |
| Fonts     | Google Fonts (Playfair Display + DM Sans) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze-image` | Upload image → get recipe from Gemini |
| `GET`  | `/api/history` | Fetch last 20 saved recipes from MongoDB |
| `PATCH`| `/api/recipes/:id/rating` | Rate a saved recipe (1-5 stars) |

---

## 🌐 MongoDB Atlas (Cloud)

No local MongoDB? Use the free cloud option:
1. Sign up at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get your connection string
4. Set `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/leftover-chef` in `.env`

> **Note:** The app works even without MongoDB — it just won't save recipe history.

---

## 📸 How to Use

1. Open the app in your browser
2. Click **"Use Camera"** to take a photo, or **"Upload Photo"** to select from gallery
3. Preview your image, then click **"Generate Recipe"**
4. Wait ~5 seconds while Gemini analyzes your leftovers
5. Enjoy your personalized AI-crafted recipe!
6. Rate it with stars to save your feedback
7. View your recipe history anytime

---

## 📝 License
MIT
![Screenshot 2026-03-31 130011](https://github.com/user-attachments/assets/52f2f6f1-cd04-4c2b-8cfc-08e366439787)
![Screenshot 2026-03-31 130111](https://github.com/user-attachments/assets/3204e753-40d9-411e-bca0-d403cd485468)
![WhatsApp Image 2026-03-21 at 11 57 11 PM](https://github.com/user-attachments/assets/d306c417-f94a-4eec-aaf2-64b5f2dc06bd)
![WhatsApp Image 2026-03-21 at 11 57 46 PM](https://github.com/user-attachments/assets/69cf61d9-eeb1-43fd-8563-7a57878bc60c)


