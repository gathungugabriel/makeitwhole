<div align="center">
  <img src="FullLogo_NoBuffer.jpg" alt="MakeItWhole Logo" width="250"/>
</div>

<div align="center">
  
[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github)](https://github.com/gathungugabriel/makeitwhole/actions)
[![License](https://img.shields.io/github/license/gathungugabriel/makeitwhole?style=flat-square)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20Next.js%20%7C%20PostgreSQL-blueviolet?style=flat-square)](#-tech-stack)
[![Issues](https://img.shields.io/github/issues/gathungugabriel/makeitwhole?style=flat-square)](https://github.com/gathungugabriel/makeitwhole/issues)
[![Last Commit](https://img.shields.io/github/last-commit/gathungugabriel/makeitwhole?style=flat-square)](https://github.com/gathungugabriel/makeitwhole/commits/main)

</div>

# 🎧 MakeItWhole — Complete What You Started

> **MakeItWhole** is a peer-to-peer platform that connects people who have incomplete products or accessories — helping them find matching parts instead of buying new ones.  
> From missing earbuds to spare gadget chargers, MakeItWhole empowers repair, reuse, and responsible consumption.

[🌍 **Visit Project on GitHub**](https://github.com/gathungugabriel/makeitwhole)

---

## 🌍 Why MakeItWhole?

Every day, millions of gadgets and accessories end up unused or discarded simply because one small part is missing.  
**MakeItWhole** makes it easy to:
- **Post** what you’re missing (or what you have to offer)
- **Get matched** with people who have the perfect complement
- **Trade, swap, or buy** to complete your gear affordably — no waste, no hassle.

Join the circular economy. Fix, save, and share.

---

## 🧩 Core Features (MVP)

| Feature              | Description                                      |
|----------------------|--------------------------------------------------|
| 🔐 **User Accounts** | Signup/Login with JWT authentication             |
| 📸 **Create Post**   | Upload photo and describe item you *have* or *need* |
| 🔗 **Smart Matching**| Automatically connects complementary listings    |
| 💬 **Messaging**     | In-app chat for users to arrange trades          |
| ⚙️ **Admin Dashboard** | Moderate users and listings                   |
| 📨 **Notifications** | Get alerts when new matches are found            |

---

## 🏗️ Tech Stack

| Layer        | Technology                         | Purpose                            |
|--------------|-------------------------------------|------------------------------------|
| **Frontend** | [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/) | Modern, responsive UI         |
| **Backend**  | [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python REST API |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Store users, items, matches   |
| **ORM**      | [SQLAlchemy](https://www.sqlalchemy.org/) | Database modeling              |
| **Auth**     | [JWT + Passlib](https://jwt.io/)        | Secure user authentication     |
| **Storage**  | AWS S3 / Cloudinary                    | Image uploads                   |
| **Deploy**   | Vercel (Frontend), Render / Railway (Backend) | Hosting               |
| **Version Control** | Git + GitHub                   | Collaboration & tracking        |

---

## ⚙️ Project Structure

```
makeitwhole/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── routes/
│   │       ├── users.py
│   │       ├── items.py
│   │       ├── matches.py
│   │       └── messages.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── styles/
│       └── utils/
│
└── README.md
```

---

## 🧠 Getting Started

### 🔹 Clone the Repository

```bash
git clone https://github.com/gathungugabriel/makeitwhole.git
cd makeitwhole
```

---

### 🔹 Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Set up your environment variables:

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://username:password@localhost/makeitwhole_db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Run the API:

```bash
uvicorn app.main:app --reload
```

---

### 🔹 Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at 👉 `http://localhost:3000`

---

## 🔄 Development Workflow

- **Backend changes:** Auto-reloads via FastAPI
- **Frontend changes:** Live reload via `npm run dev`
- **Database changes:** Use Alembic for migrations
- **Version control:** Create feature branches → Pull Requests

---

## 🧪 API Testing

Use:
- **Swagger UI:** `http://localhost:8000/docs`
- **Postman**: For manual API testing

---

## 🚀 Deployment

- **Frontend:** Vercel
- **Backend:** Render or Railway
- **Database:** Supabase or ElephantSQL

---

## 💡 Future Enhancements

- AI-assisted part recognition from photos
- Geo-based matching (find nearby users)
- Sustainability dashboard
- Mobile app (React Native or Flutter)
- Payment integration (e.g., M-Pesa, PayPal)

---

## 🤝 Contributing

Pull requests are welcome!  
Please open an issue first to discuss proposed changes or features.

---

## 🛠️ License

This project is licensed under the **MIT License**.

---

<div align="center">
👽 Built for the fixers, tinkerers, and savers.  
<strong>“Don’t replace — complete.”</strong>
</div>
